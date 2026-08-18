import { describe, expect, test } from "bun:test"
import { account, shortLinks, user } from "./db/schema"
import { renderAdvertisingPage } from "./api/handlers/advertising-page"
import { renderPasswordPage } from "./api/handlers/password-page"
import {
  createApiKeySchema,
  createLinkSchema,
  recentClicksQuerySchema,
  updateLinkGoalsSchema,
  updateLinkSchema,
  updateAdvertisingSettingsSchema,
  updateSettingsSchema,
} from "./schemas"
import { openapi } from "./openapi"

Object.assign(process.env, {
  DATABASE_URL: "postgresql://test:test@127.0.0.1:1/test",
  REDIS_URL: "redis://127.0.0.1:1",
  REDIS_PREFIX: "shared:corto:",
  BETTER_AUTH_SECRET: "test-secret-that-is-at-least-32-characters-long",
  BETTER_AUTH_URL: "http://localhost:8787",
  ADMIN_EMAIL: "admin@example.com",
  SHORT_URL_BASE: "https://sho.rt",
  IP_HASH_SECRET: "different-test-secret-at-least-32-characters",
  NODE_ENV: "test",
  TRUST_PROXY: "false",
})

describe("public contract", () => {
  test("validates and normalizes link input", () => {
    expect(
      createLinkSchema.parse({ url: "https://example.com", slug: " My-Link " })
    ).toMatchObject({
      url: "https://example.com",
      slug: "my-link",
      active: true,
    })
    expect(
      createLinkSchema.safeParse({ url: "javascript:alert(1)" }).success
    ).toBe(false)
    expect(
      createLinkSchema.safeParse({ url: "https://example.com", slug: "login" })
        .success
    ).toBe(false)
    expect(updateLinkSchema.safeParse({}).success).toBe(false)
    expect(
      updateAdvertisingSettingsSchema.parse({
        enabled: true,
        delaySeconds: "5",
        banners: [
          {
            preset: "468x60",
            script: `<script src="https://www.highperformanceformat.com/03e98c0f214162b3c1328af63603e049/invoke.js"></script>`,
          },
        ],
      })
    ).toMatchObject({
      enabled: true,
      delaySeconds: 5,
      banners: [
        {
          preset: "468x60",
          scriptUrl:
            "https://www.highperformanceformat.com/03e98c0f214162b3c1328af63603e049/invoke.js",
        },
      ],
    })
    expect(
      updateAdvertisingSettingsSchema.safeParse({
        banners: [
          { preset: "468x60", script: "https://example.com/invoke.js" },
        ],
      }).success
    ).toBe(false)
    expect(updateSettingsSchema.parse({ registrationEnabled: false })).toEqual({
      registrationEnabled: false,
    })
    expect(
      updateSettingsSchema.safeParse({
        discordWebhookUrl: "https://discord.com/api/webhooks/1/example",
      }).success
    ).toBe(true)
    expect(
      updateSettingsSchema.safeParse({
        discordWebhookUrl: "https://example.com/webhook",
      }).success
    ).toBe(false)
    expect(updateLinkGoalsSchema.parse({ goals: [10, 50, 100] })).toEqual({
      goals: [10, 50, 100],
    })
    expect(updateLinkGoalsSchema.safeParse({ goals: [10, 10] }).success).toBe(
      false
    )
    expect(recentClicksQuerySchema.parse({ page: "2", country: "IT" })).toEqual(
      {
        page: 2,
        pageSize: 10,
        country: "IT",
      }
    )
    expect(recentClicksQuerySchema.safeParse({ page: 0 }).success).toBe(false)
    expect(createApiKeySchema.parse({ name: "deployment" })).toEqual({
      name: "deployment",
    })
  })

  test("validates click limits and link passwords", () => {
    expect(
      createLinkSchema.parse({
        url: "https://example.com",
        clickLimit: "250",
        password: "segreto",
      })
    ).toMatchObject({ clickLimit: 250, password: "segreto" })
    expect(
      createLinkSchema.safeParse({ url: "https://example.com", clickLimit: 0 })
        .success
    ).toBe(false)
    expect(
      createLinkSchema.safeParse({
        url: "https://example.com",
        clickLimit: 1.5,
      }).success
    ).toBe(false)
    expect(
      createLinkSchema.safeParse({
        url: "https://example.com",
        password: "abc",
      }).success
    ).toBe(false)
    // null is how the API is told to clear either field.
    expect(
      updateLinkSchema.parse({ clickLimit: null, password: null })
    ).toEqual({ clickLimit: null, password: null })
  })

  test("never exposes the stored link password", async () => {
    const { presentLink } = await import("./api/presenters")
    const row = {
      id: "link-id",
      userId: "user-id",
      slug: "guida",
      url: "https://example.com",
      title: null,
      active: true,
      adFree: false,
      expiresAt: null,
      clickLimit: 250,
      passwordHash: "$argon2id$v=19$m=65536,t=2,p=1$abc$def",
      clicks: 3,
      lastClickedAt: null,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    }

    const presented = presentLink(row)
    expect(presented).toMatchObject({ clickLimit: 250, hasPassword: true })
    expect(JSON.stringify(presented)).not.toContain("argon2")
    expect(presentLink({ ...row, passwordHash: null })).toMatchObject({
      hasPassword: false,
    })
  })

  test("renders the link password gate with its failure states", () => {
    const page = renderPasswordPage({ slug: "guida", error: null })
    expect(page.html).toContain('<form method="post" action="/guida">')
    expect(page.html).toContain('name="password"')
    expect(page.html).toContain('content="noindex,nofollow"')
    expect(page.csp).toContain("form-action 'self'")

    expect(
      renderPasswordPage({ slug: "guida", error: "invalid" }).html
    ).toContain("Password errata")
    expect(
      renderPasswordPage({ slug: "guida", error: "throttled" }).html
    ).toContain("Troppi tentativi")
    // A hostile slug must not break out of the form action.
    expect(
      renderPasswordPage({ slug: 'a"><script>', error: null }).html
    ).not.toContain("<script>a")
  })

  test("renders automatic and manual advertising interstitial modes", () => {
    const page = renderAdvertisingPage({
      destination: "https://example.com/catalog",
      automaticRedirect: false,
      delaySeconds: 5,
      banners: [
        {
          preset: "320x50",
          scriptUrl:
            "https://www.highperformanceformat.com/03e98c0f214162b3c1328af63603e049/invoke.js",
        },
      ],
      openGraphImage: "https://example.com/preview.png",
    })

    expect(page.html).toContain("Continua verso il sito")
    expect(page.html).toContain('class="continue" hidden id="continue"')
    expect(page.html).toContain('continueButton?.removeAttribute("hidden")')
    expect(page.html).toContain('document.visibilityState !== "visible"')
    expect(page.html).toContain("!document.hasFocus()")
    expect(page.html).toContain('style="width:320px;min-height:50px"')
    expect(page.html).toContain("https://example.com/preview.png")

    const automaticPage = renderAdvertisingPage({
      destination: "https://example.com/catalog",
      automaticRedirect: true,
      delaySeconds: 5,
      banners: [],
      openGraphImage: null,
    })
    expect(automaticPage.html).toContain(
      'document.visibilityState !== "visible"'
    )
    expect(automaticPage.html).toContain(
      "window.location.replace(redirect.destination)"
    )
  })

  test("publishes the documented routes", () => {
    expect(openapi.servers).toEqual([{ url: "/api" }])
    expect(openapi.paths).toHaveProperty("/v1/links")
    expect(openapi.paths).toHaveProperty("/v1/analytics/summary")
    expect(openapi.paths).toHaveProperty("/v1/registration")
    expect(openapi.paths).toHaveProperty("/v1/auth/status")
    expect(openapi.paths).toHaveProperty("/v1/settings")
    expect(openapi.paths).toHaveProperty("/v1/advertising")
    expect(openapi.paths).toHaveProperty("/v1/links/{id}/goals")
    expect(openapi.components.securitySchemes.apiKey.name).toBe("x-api-key")
  })

  test("keeps Better Auth mapped to the existing database columns", () => {
    expect(user.emailVerified.name).toBe("emailVerified")
    expect(account.userId.name).toBe("userId")
    expect(shortLinks.userId.name).toBe("user_id")
  })

  test("keeps passkeys disabled without an RP ID", async () => {
    const { parseEnv } = await import("./env")
    const { authOptions } = await import("./auth")
    expect(
      parseEnv({ ...process.env, PASSKEY_RP_ID: "" }).PASSKEY_ENABLED
    ).toBe(false)
    expect(
      parseEnv({ ...process.env, PASSKEY_RP_ID: "localhost" }).PASSKEY_ENABLED
    ).toBe(true)
    expect(authOptions.plugins?.some((plugin) => plugin.id === "passkey")).toBe(
      false
    )
  })

  test("recognizes the configured administrator regardless of email casing", async () => {
    const { isConfiguredAdmin } = await import("./auth")
    expect(isConfiguredAdmin("ADMIN@example.com")).toBe(true)
    expect(isConfiguredAdmin("member@example.com")).toBe(false)
  })

  test("namespaces every Redis key", async () => {
    const { keyWithPrefix } = await import("./redis")
    expect(keyWithPrefix("shared-app", "link", "estate")).toBe(
      "shared-app:link:estate"
    )
    expect(keyWithPrefix("shared-app:", "auth", "session")).toBe(
      "shared-app:auth:session"
    )
  })

  test("encrypts notification credentials before persistence", async () => {
    const { decryptSecret, encryptSecret } = await import("./secrets")
    const encrypted = encryptSecret("telegram-token")
    expect(encrypted).not.toContain("telegram-token")
    expect(decryptSecret(encrypted)).toBe("telegram-token")
    expect(decryptSecret("invalid")).toBeNull()
  })

  test("serves health and OpenAPI without external services", async () => {
    const { app } = await import("./index")
    const health = await app.request("/api/health")
    expect(health.status).toBe(200)
    expect(await health.json()).toEqual({ status: "ok" })

    const spec = await app.request("/api/openapi.json")
    expect(spec.status).toBe(200)
    expect((await spec.json()).openapi).toBe("3.1.0")

    const authStatus = await app.request("/api/v1/auth/status")
    expect(authStatus.status).toBe(200)
    expect(await authStatus.json()).toEqual({ passkeyEnabled: false })

    expect((await app.request("/v1/links")).status).toBe(404)
  })
})
