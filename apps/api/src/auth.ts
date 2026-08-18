import { apiKey } from "@better-auth/api-key"
import { passkey } from "@better-auth/passkey"
import { redisStorage } from "@better-auth/redis-storage"
import { betterAuth } from "better-auth"
import type { BetterAuthOptions } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import {
  APIError,
  createAuthMiddleware,
  getAuthoritativeSessionFromCtx,
} from "better-auth/api"
import { admin } from "better-auth/plugins/admin"
import { twoFactor } from "better-auth/plugins/two-factor"
import { db } from "./db"
import * as schema from "./db/schema"
import { env } from "./env"
import { redis, normalizeRedisPrefix } from "./redis"
import { getRegistrationEnabled } from "./api/handlers/settings"

export const isConfiguredAdmin = (email: string) =>
  email.toLowerCase() === env.ADMIN_EMAIL

export const authOptions = {
  appName: "Corto",
  baseURL: env.BETTER_AUTH_URL,
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: { enabled: true },
  secondaryStorage: redisStorage({
    client: redis,
    keyPrefix: `${normalizeRedisPrefix(env.REDIS_PREFIX)}auth:`,
  }),
  session: {
    storeSessionInDatabase: true,
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },
  rateLimit: {
    enabled: true,
    storage: "secondary-storage",
  },
  hooks: {
    before: createAuthMiddleware(async (context) => {
      if (context.path.startsWith("/admin/")) {
        const session = await getAuthoritativeSessionFromCtx(context)
        if (
          session &&
          isConfiguredAdmin(session.user.email) &&
          session.user.role !== "admin"
        ) {
          await context.context.internalAdapter.updateUser(session.user.id, {
            role: "admin",
          })
        }
      }
      if (
        context.path === "/sign-up/email" &&
        !(await getRegistrationEnabled())
      ) {
        throw new APIError("FORBIDDEN", {
          message: "Le registrazioni sono disattivate.",
        })
      }
    }),
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => ({
          data: {
            role:
              isConfiguredAdmin(user.email)
                ? "admin"
                : typeof user.role === "string"
                  ? user.role
                  : "user",
          },
        }),
      },
    },
  },
  trustedOrigins: env.CORS_ORIGINS,
  advanced: { useSecureCookies: env.NODE_ENV === "production" },
  plugins: [
    apiKey({
      references: "user",
      permissions: {
        defaultPermissions: { links: ["read", "write"] },
      },
    }),
    admin(),
    twoFactor(),
    ...(env.PASSKEY_ENABLED
      ? [
          passkey({
            rpID: env.PASSKEY_RP_ID,
            rpName: env.PASSKEY_RP_NAME,
            origin: env.PASSKEY_ORIGIN,
          }),
        ]
      : []),
  ],
} satisfies BetterAuthOptions

export const auth = betterAuth(authOptions)
