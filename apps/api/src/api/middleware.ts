import type { MiddlewareHandler } from "hono"
import { auth } from "../auth"
import { env } from "../env"
import type { AppEnv } from "./types"

const sessionPrincipal = async (headers: Headers) => {
  const session = await auth.api.getSession({ headers })
  return session
    ? {
        userId: session.user.id,
        apiKey: false,
        email: session.user.email.toLowerCase(),
        role:
          typeof session.user.role === "string" ? session.user.role : undefined,
      }
    : null
}

export const requireAuth =
  (permission: "read" | "write"): MiddlewareHandler<AppEnv> =>
  async (c, next) => {
    const key = c.req.header("x-api-key")
    if (key) {
      const result = await auth.api.verifyApiKey({
        body: { key, permissions: { links: [permission] } },
      })
      if (!result.valid || !result.key) {
        return c.json(
          { message: "Invalid API key or insufficient permissions" },
          401
        )
      }
      c.set("principal", { userId: result.key.referenceId, apiKey: true })
    } else {
      const principal = await sessionPrincipal(c.req.raw.headers)
      if (!principal) return c.json({ message: "Authentication required" }, 401)
      c.set("principal", principal)
    }
    await next()
  }

export const requireSession: MiddlewareHandler<AppEnv> = async (c, next) => {
  const principal = await sessionPrincipal(c.req.raw.headers)
  if (!principal)
    return c.json({ message: "A browser session is required" }, 401)
  c.set("principal", principal)
  await next()
}

export const requireAdmin: MiddlewareHandler<AppEnv> = async (c, next) => {
  const principal = await sessionPrincipal(c.req.raw.headers)
  if (!principal)
    return c.json({ message: "A browser session is required" }, 401)
  if (principal.email !== env.ADMIN_EMAIL && principal.role !== "admin") {
    return c.json({ message: "Administrator access required" }, 403)
  }
  c.set("principal", principal)
  await next()
}
