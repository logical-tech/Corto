import { randomUUID } from "node:crypto"
import { and, desc, eq } from "drizzle-orm"
import { db } from "../../db"
import { shortLinks } from "../../db/schema"
import { redis, redisKey } from "../../redis"
import type { CreateLinkInput, UpdateLinkInput } from "../../schemas"
import { iso } from "../presenters"

// ponytail: Bun's argon2id; swap only if the API ever has to run outside Bun.
export const hashLinkPassword = (password: string) =>
  Bun.password.hash(password, "argon2id")

const cacheLink = async (row: typeof shortLinks.$inferSelect) => {
  try {
    await redis.set(
      redisKey("link", row.slug),
      JSON.stringify({
        id: row.id,
        userId: row.userId,
        url: row.url,
        active: row.active,
        adFree: row.adFree,
        expiresAt: iso(row.expiresAt),
        hasPassword: row.passwordHash !== null,
      }),
      "EX",
      3600
    )
  } catch {
    // PostgreSQL remains authoritative when shared Redis is unavailable.
  }
}

export const dropCachedLink = async (slug: string) => {
  try {
    await redis.del(redisKey("link", slug))
  } catch {
    // Cache invalidation is best effort; cached entries expire after one hour.
  }
}

export const listLinks = (userId: string) =>
  db
    .select()
    .from(shortLinks)
    .where(eq(shortLinks.userId, userId))
    .orderBy(desc(shortLinks.createdAt))

export const createLink = async (userId: string, data: CreateLinkInput) => {
  const passwordHash = data.password
    ? await hashLinkPassword(data.password)
    : null

  for (let attempt = 0; attempt < 4; attempt++) {
    const slug = data.slug ?? randomUUID().replaceAll("-", "").slice(0, 8)
    try {
      const [row] = await db
        .insert(shortLinks)
        .values({
          id: randomUUID(),
          userId,
          slug,
          url: data.url,
          title: data.title ?? null,
          active: data.active,
          adFree: data.adFree,
          expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
          clickLimit: data.clickLimit ?? null,
          passwordHash,
        })
        .returning()
      await cacheLink(row)
      return row
    } catch (error: any) {
      if (error?.code !== "23505" || data.slug || attempt === 3) throw error
    }
  }
  throw new Error("Could not generate a unique slug")
}

export const getOwnedLink = async (id: string, userId: string) => {
  const [row] = await db
    .select()
    .from(shortLinks)
    .where(and(eq(shortLinks.id, id), eq(shortLinks.userId, userId)))
  return row
}

export const updateOwnedLink = async (
  id: string,
  userId: string,
  data: UpdateLinkInput
) => {
  const current = await getOwnedLink(id, userId)
  if (!current) return null

  const values: Partial<typeof shortLinks.$inferInsert> = {
    updatedAt: new Date(),
  }
  if (Object.hasOwn(data, "url")) values.url = data.url
  if (Object.hasOwn(data, "slug")) values.slug = data.slug
  if (Object.hasOwn(data, "title")) values.title = data.title
  if (Object.hasOwn(data, "active")) values.active = data.active
  if (Object.hasOwn(data, "adFree")) values.adFree = data.adFree
  if (Object.hasOwn(data, "expiresAt")) {
    values.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null
  }
  if (Object.hasOwn(data, "clickLimit"))
    values.clickLimit = data.clickLimit ?? null
  if (Object.hasOwn(data, "password")) {
    values.passwordHash = data.password
      ? await hashLinkPassword(data.password)
      : null
  }

  const [row] = await db
    .update(shortLinks)
    .set(values)
    .where(and(eq(shortLinks.id, id), eq(shortLinks.userId, userId)))
    .returning()
  await Promise.all([dropCachedLink(current.slug), cacheLink(row)])
  return row
}

export const deleteOwnedLink = async (id: string, userId: string) => {
  const [row] = await db
    .delete(shortLinks)
    .where(and(eq(shortLinks.id, id), eq(shortLinks.userId, userId)))
    .returning({ slug: shortLinks.slug })
  if (row) await dropCachedLink(row.slug)
  return Boolean(row)
}

export type RedirectLink = {
  id: string
  userId: string
  url: string
  active: boolean
  adFree: boolean
  expiresAt: string | null
  hasPassword: boolean
}

const parseCachedRedirect = (value: string): RedirectLink | null => {
  const parsed: unknown = JSON.parse(value)
  if (!parsed || typeof parsed !== "object") return null
  const link = parsed as Partial<RedirectLink>
  if (
    typeof link.id !== "string" ||
    typeof link.userId !== "string" ||
    typeof link.url !== "string" ||
    typeof link.active !== "boolean" ||
    typeof link.adFree !== "boolean" ||
    typeof link.hasPassword !== "boolean" ||
    (link.expiresAt !== null && typeof link.expiresAt !== "string")
  ) {
    return null
  }
  return link as RedirectLink
}

export const resolveRedirect = async (
  slug: string
): Promise<RedirectLink | null> => {
  try {
    const hit = await redis.get(redisKey("link", slug))
    if (hit) {
      const cached = parseCachedRedirect(hit)
      if (cached) return cached
    }
  } catch {
    // Fall through to PostgreSQL.
  }

  const [row] = await db
    .select()
    .from(shortLinks)
    .where(eq(shortLinks.slug, slug))
  if (!row) return null
  await cacheLink(row)
  return {
    id: row.id,
    userId: row.userId,
    url: row.url,
    active: row.active,
    adFree: row.adFree,
    expiresAt: iso(row.expiresAt),
    hasPassword: row.passwordHash !== null,
  }
}

export const verifyLinkPassword = async (id: string, password: string) => {
  const [row] = await db
    .select({ passwordHash: shortLinks.passwordHash })
    .from(shortLinks)
    .where(eq(shortLinks.id, id))
  if (!row?.passwordHash) return false
  return Bun.password.verify(password, row.passwordHash)
}
