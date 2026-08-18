import type { InferSelectModel } from "drizzle-orm"
import { env } from "../env"
import { shortLinks } from "../db/schema"

type ShortLink = InferSelectModel<typeof shortLinks>

export const iso = (value: Date | string | null | undefined) =>
  value ? new Date(value).toISOString() : null

export const presentLink = (row: ShortLink) => ({
  id: row.id,
  slug: row.slug,
  url: row.url,
  title: row.title,
  active: row.active,
  adFree: row.adFree,
  expiresAt: iso(row.expiresAt),
  clickLimit: row.clickLimit,
  hasPassword: row.passwordHash !== null,
  shortUrl: `${env.SHORT_URL_BASE}/${row.slug}`,
  clicks: Number(row.clicks),
  lastClickedAt: iso(row.lastClickedAt),
  createdAt: iso(row.createdAt)!,
  updatedAt: iso(row.updatedAt)!,
})

export const presentApiKey = (
  key: Record<string, any>,
  includeSecret = false
) => ({
  id: key.id as string,
  name: (key.name as string | null) ?? "API key",
  prefix: (key.prefix as string | null) ?? null,
  start: (key.start as string | null) ?? null,
  permissions: (key.permissions?.links as string[] | undefined) ?? [],
  lastUsedAt: iso(key.lastRequest),
  expiresAt: iso(key.expiresAt),
  createdAt: iso(key.createdAt)!,
  ...(includeSecret ? { key: key.key as string } : {}),
})
