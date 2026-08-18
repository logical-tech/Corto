import { z } from "zod"

export const parseEnv = (input: NodeJS.ProcessEnv) =>
  z
    .object({
      PORT: z.coerce.number().int().min(1).max(65_535).default(8787),
      DATABASE_URL: z.string().min(1),
      REDIS_URL: z.string().min(1),
      REDIS_PREFIX: z.string().trim().min(1).default("shorts:"),
      BETTER_AUTH_SECRET: z.string().min(32),
      BETTER_AUTH_URL: z.string().url(),
      ADMIN_EMAIL: z
        .string()
        .trim()
        .email()
        .transform((value) => value.toLowerCase()),
      SHORT_URL_BASE: z.string().url().optional(),
      IP_HASH_SECRET: z.string().min(32).optional(),
      TRUST_PROXY: z
        .enum(["true", "false"])
        .default("true")
        .transform((value) => value === "true"),
      CORS_ORIGINS: z
        .string()
        .default("http://localhost:3000,http://localhost:5173"),
      PASSKEY_RP_ID: z.string().trim().optional(),
      PASSKEY_RP_NAME: z.string().trim().optional(),
      PASSKEY_ORIGIN: z.string().trim().optional(),
      NODE_ENV: z
        .enum(["development", "test", "production"])
        .default("development"),
    })
    .transform((value) => ({
      ...value,
      SHORT_URL_BASE: (value.SHORT_URL_BASE ?? value.BETTER_AUTH_URL).replace(
        /\/$/,
        ""
      ),
      IP_HASH_SECRET: value.IP_HASH_SECRET ?? value.BETTER_AUTH_SECRET,
      CORS_ORIGINS: value.CORS_ORIGINS.split(",")
        .map((origin) => origin.trim())
        .filter(Boolean),
      PASSKEY_ENABLED: Boolean(value.PASSKEY_RP_ID),
      PASSKEY_RP_NAME: value.PASSKEY_RP_NAME || "Shorts",
      PASSKEY_ORIGIN: (value.PASSKEY_ORIGIN || value.BETTER_AUTH_URL).replace(
        /\/$/,
        ""
      ),
    }))
    .parse(input)

export const env = parseEnv(process.env)
