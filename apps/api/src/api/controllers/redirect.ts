import { createHmac } from "node:crypto"
import type { Context } from "hono"
import { getConnInfo } from "hono/bun"
import { env } from "../../env"
import { recordClick } from "../handlers/clicks"
import { resolveAdvertisingSettings } from "../handlers/advertising"
import {
  getOpenGraphImage,
  renderAdvertisingPage,
} from "../handlers/advertising-page"
import { resolveRedirect, verifyLinkPassword } from "../handlers/links"
import { renderPasswordPage } from "../handlers/password-page"
import { redis, redisKey } from "../../redis"
import type { AppEnv } from "../types"

const UNLOCK_ATTEMPTS = 10
const UNLOCK_WINDOW_SECONDS = 300

// Redis is shared across API instances, so the budget is global per link and IP.
const unlockAttemptsExhausted = async (linkId: string, ipHash: string) => {
  try {
    const key = redisKey("unlock", linkId, ipHash)
    const attempts = await redis.incr(key)
    if (attempts === 1) await redis.expire(key, UNLOCK_WINDOW_SECONDS)
    return attempts > UNLOCK_ATTEMPTS
  } catch {
    // A missing cache must not turn into an open door, but it must not lock
    // everybody out either: fall back to allowing the single attempt.
    return false
  }
}

export const detectDevice = (userAgent: string) =>
  /tablet|ipad/i.test(userAgent)
    ? "tablet"
    : /mobile|android|iphone/i.test(userAgent)
      ? "mobile"
      : "desktop"

const requestIp = (c: Context) => {
  if (env.TRUST_PROXY) {
    const forwarded = c.req.header("x-forwarded-for")?.split(",")[0]?.trim()
    if (forwarded) return forwarded
    const real = c.req.header("x-real-ip")?.trim()
    if (real) return real
  }
  try {
    return getConnInfo(c).remote.address ?? "unknown"
  } catch {
    return "unknown"
  }
}

// Returns null once the visitor is allowed through, otherwise the page to show.
const unlockGate = async (
  c: Context<AppEnv>,
  linkId: string,
  ipHash: string
) => {
  if (c.req.method !== "POST") return { error: null, status: 200 } as const

  if (await unlockAttemptsExhausted(linkId, ipHash)) {
    return { error: "throttled", status: 429 } as const
  }

  const submitted = (await c.req.parseBody())["password"]
  if (
    typeof submitted !== "string" ||
    !(await verifyLinkPassword(linkId, submitted))
  ) {
    return { error: "invalid", status: 401 } as const
  }
  return null
}

export const redirectController = async (c: Context<AppEnv>, slug: string) => {
  const link = await resolveRedirect(slug.toLowerCase())
  if (
    !link ||
    !link.active ||
    (link.expiresAt && new Date(link.expiresAt) <= new Date())
  ) {
    return c.json({ message: "Link not found" }, 404)
  }

  const userAgent = (c.req.header("user-agent") ?? "").slice(0, 500)
  const countryHeader = env.TRUST_PROXY
    ? c.req.header("cf-ipcountry")?.toUpperCase()
    : undefined
  const country =
    countryHeader && /^[A-Z]{2}$/.test(countryHeader) ? countryHeader : null
  const ipHash = createHmac("sha256", env.IP_HASH_SECRET)
    .update(requestIp(c))
    .digest("hex")

  if (link.hasPassword) {
    const gate = await unlockGate(c, link.id, ipHash)
    if (gate) {
      const page = renderPasswordPage({ slug, error: gate.error })
      c.header("Cache-Control", "no-store")
      c.header("Content-Security-Policy", page.csp)
      return c.html(page.html, gate.status)
    }
  }

  void recordClick({
    linkId: link.id,
    ipHash,
    referrer: c.req.header("referer")?.slice(0, 2048) ?? null,
    userAgent: userAgent || null,
    country,
    device: detectDevice(userAgent),
  }).catch((error) => console.error("Click tracking failed", error))

  if (!link.adFree) {
    try {
      const advertising = await resolveAdvertisingSettings(link.userId)
      if (advertising.enabled && advertising.banners.length) {
        const page = renderAdvertisingPage({
          destination: link.url,
          automaticRedirect: advertising.automaticRedirect,
          delaySeconds: advertising.delaySeconds,
          banners: advertising.banners,
          openGraphImage: await getOpenGraphImage(link.url),
        })
        c.header("Cache-Control", "no-store")
        c.header("Content-Security-Policy", page.csp)
        return c.html(page.html)
      }
    } catch (error) {
      // An optional interstitial must never make an otherwise cached link fail.
      console.error("Advertising redirect failed", error)
    }
  }

  return c.redirect(link.url, 302)
}
