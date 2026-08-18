import { z } from "zod"
import {
  ADSTERRA_BANNER_PRESET_IDS,
  extractAdsterraScriptUrl,
} from "./advertising"

export const RESERVED_SLUGS = new Set([
  "api",
  "api-keys",
  "dashboard",
  "docs",
  "favicon.ico",
  "health",
  "links",
  "login",
  "openapi.json",
  "opengraph-image",
  "register",
  "robots.txt",
  "settings",
  "v1",
])

export const normalizeSlug = (slug: string) => slug.trim().toLowerCase()

const slug = z
  .string()
  .transform(normalizeSlug)
  .pipe(
    z
      .string()
      .min(3)
      .max(64)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  )
  .refine((value) => !RESERVED_SLUGS.has(value), "Reserved slug")

const url = z
  .string()
  .trim()
  .url()
  .max(2048)
  .refine((value) => ["http:", "https:"].includes(new URL(value).protocol), {
    message: "Only HTTP and HTTPS URLs are supported",
  })

const clickLimit = z.coerce.number().int().min(1).max(1_000_000_000)

const linkPassword = z.string().min(4).max(128)

export const createLinkSchema = z.object({
  url,
  slug: slug.optional(),
  title: z.string().trim().max(200).nullable().optional(),
  active: z.boolean().default(true),
  adFree: z.boolean().default(false),
  expiresAt: z.string().datetime({ offset: true }).nullable().optional(),
  clickLimit: clickLimit.nullable().optional(),
  password: linkPassword.nullable().optional(),
})

export const updateLinkSchema = z
  .object({
    url: url.optional(),
    slug: slug.optional(),
    title: z.string().trim().max(200).nullable().optional(),
    active: z.boolean().optional(),
    adFree: z.boolean().optional(),
    expiresAt: z.string().datetime({ offset: true }).nullable().optional(),
    clickLimit: clickLimit.nullable().optional(),
    password: linkPassword.nullable().optional(),
  })
  .refine(
    (value) => Object.keys(value).length > 0,
    "At least one field is required"
  )

export const recentClicksQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(5).max(50).default(10),
  country: z.string().trim().max(64).optional(),
  device: z.string().trim().max(64).optional(),
})

export const createApiKeySchema = z.object({
  name: z.string().trim().min(1).max(100),
  expiresIn: z.coerce.number().int().min(3600).max(31_536_000).optional(),
})

export const deleteApiKeySchema = z.object({ id: z.string().min(1) })

const discordWebhookUrl = z
  .string()
  .trim()
  .url()
  .max(2048)
  .refine((value) => {
    const url = new URL(value)
    return (
      url.protocol === "https:" &&
      ["discord.com", "discordapp.com"].includes(url.hostname) &&
      /^\/api\/webhooks\/\d+\/[^/]+/.test(url.pathname)
    )
  }, "Enter a valid Discord webhook URL")

const notificationCredential = z.string().trim().min(1).max(512)

export const updateSettingsSchema = z
  .object({
    registrationEnabled: z.boolean().optional(),
    discordWebhookUrl: discordWebhookUrl.nullable().optional(),
    telegramBotToken: notificationCredential.nullable().optional(),
    telegramChatId: notificationCredential.nullable().optional(),
  })
  .refine(
    (value) => Object.keys(value).length > 0,
    "At least one field is required"
  )
  .superRefine((value, context) => {
    const hasToken = Object.hasOwn(value, "telegramBotToken")
    const hasChatId = Object.hasOwn(value, "telegramChatId")
    if (hasToken !== hasChatId) {
      context.addIssue({
        code: "custom",
        message: "Telegram bot token and chat ID must be updated together",
      })
    }
  })

const adsterraScript = z
  .string()
  .trim()
  .min(1)
  .max(8192)
  .transform((value, context) => {
    const scriptUrl = extractAdsterraScriptUrl(value)
    if (scriptUrl) return scriptUrl
    context.addIssue({
      code: "custom",
      message: "Paste a valid Adsterra invoke.js URL or code snippet",
    })
    return z.NEVER
  })

const adsterraBannerSchema = z
  .object({
    preset: z.enum(ADSTERRA_BANNER_PRESET_IDS),
    script: adsterraScript,
  })
  .transform(({ preset, script }) => ({ preset, scriptUrl: script }))

export const updateAdvertisingSettingsSchema = z
  .object({
    enabled: z.boolean().optional(),
    automaticRedirect: z.boolean().optional(),
    delaySeconds: z.coerce.number().int().min(1).max(60).optional(),
    banners: z
      .array(adsterraBannerSchema)
      .max(6)
      .refine(
        (banners) =>
          new Set(banners.map((banner) => banner.preset)).size ===
          banners.length,
        "Each Adsterra banner size can be configured once"
      )
      .optional(),
  })
  .refine(
    (value) => Object.keys(value).length > 0,
    "At least one field is required"
  )

const goalClicks = z.coerce.number().int().min(1).max(1_000_000_000)

export const updateLinkGoalsSchema = z.object({
  goals: z
    .array(goalClicks)
    .max(20)
    .refine(
      (goals) => new Set(goals).size === goals.length,
      "Goals must be unique"
    ),
})

export type CreateLinkInput = z.infer<typeof createLinkSchema>
export type UpdateLinkInput = z.infer<typeof updateLinkSchema>
export type RecentClicksQuery = z.infer<typeof recentClicksQuerySchema>
export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>
export type UpdateAdvertisingSettingsInput = z.infer<
  typeof updateAdvertisingSettingsSchema
>
export type UpdateLinkGoalsInput = z.infer<typeof updateLinkGoalsSchema>
