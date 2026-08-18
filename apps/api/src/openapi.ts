const link = {
  type: "object",
  required: [
    "id",
    "slug",
    "url",
    "shortUrl",
    "active",
    "adFree",
    "hasPassword",
    "clicks",
    "createdAt",
    "updatedAt",
  ],
  properties: {
    id: { type: "string", format: "uuid" },
    slug: { type: "string", example: "guida" },
    url: { type: "string", format: "uri" },
    title: { type: ["string", "null"] },
    active: { type: "boolean" },
    adFree: {
      type: "boolean",
      description: "Skip the configured advertising interstitial for this link",
      default: false,
    },
    expiresAt: { type: ["string", "null"], format: "date-time" },
    clickLimit: {
      type: ["integer", "null"],
      description:
        "The link deactivates itself once it reaches this many clicks",
    },
    hasPassword: { type: "boolean" },
    shortUrl: { type: "string", format: "uri" },
    clicks: { type: "integer" },
    lastClickedAt: { type: ["string", "null"], format: "date-time" },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
} as const

const linkInput = {
  type: "object",
  required: ["url"],
  properties: {
    url: {
      type: "string",
      format: "uri",
      example: "https://example.com/guida",
    },
    slug: { type: "string", minLength: 3, maxLength: 64 },
    title: { type: ["string", "null"], maxLength: 200 },
    active: { type: "boolean", default: true },
    adFree: { type: "boolean", default: false },
    expiresAt: { type: ["string", "null"], format: "date-time" },
    clickLimit: {
      type: ["integer", "null"],
      minimum: 1,
      maximum: 1_000_000_000,
      description:
        "The link deactivates itself once it reaches this many clicks",
    },
    password: {
      type: ["string", "null"],
      minLength: 4,
      maxLength: 128,
      description:
        "Visitors must submit this password before the redirect; null clears it",
    },
  },
} as const

const linkGoalsInput = {
  type: "object",
  required: ["goals"],
  properties: {
    goals: {
      type: "array",
      maxItems: 20,
      items: { type: "integer", minimum: 1, maximum: 1_000_000_000 },
      example: [10, 50, 100],
    },
  },
} as const

const security = [{ cookieAuth: [] }, { apiKey: [] }]
const idParameter = [
  { name: "id", in: "path", required: true, schema: { type: "string" } },
] as const
const recentClickQueryParameters = [
  {
    name: "page",
    in: "query",
    schema: { type: "integer", minimum: 1, default: 1 },
  },
  {
    name: "pageSize",
    in: "query",
    schema: { type: "integer", minimum: 5, maximum: 50, default: 10 },
  },
  { name: "country", in: "query", schema: { type: "string", maxLength: 64 } },
  { name: "device", in: "query", schema: { type: "string", maxLength: 64 } },
] as const
const sessionSecurity = [{ cookieAuth: [] }]

export const openapi = {
  openapi: "3.1.0",
  servers: [{ url: "/api" }],
  info: {
    title: "Shorts API",
    version: "1.0.0",
    description:
      "Create short links and inspect click analytics. API keys are sent with x-api-key.",
  },
  paths: {
    "/health": {
      get: {
        summary: "Health check",
        responses: { "200": { description: "Healthy" } },
      },
    },
    "/v1/links": {
      get: {
        summary: "List links",
        security,
        responses: { "200": { description: "Links" } },
      },
      post: {
        summary: "Create a link",
        security,
        requestBody: {
          required: true,
          content: { "application/json": { schema: linkInput } },
        },
        responses: {
          "201": { description: "Created link" },
          "409": { description: "Slug already exists" },
        },
      },
    },
    "/v1/links/{id}": {
      parameters: idParameter,
      get: {
        summary: "Get link and analytics",
        parameters: recentClickQueryParameters,
        security,
        responses: { "200": { description: "Link detail" } },
      },
      patch: {
        summary: "Update a link",
        security,
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { ...linkInput, required: [] } },
          },
        },
        responses: { "200": { description: "Updated link" } },
      },
      delete: {
        summary: "Delete a link",
        security,
        responses: { "204": { description: "Deleted" } },
      },
    },
    "/v1/links/{id}/analytics": {
      parameters: idParameter,
      get: {
        summary: "Get link analytics",
        parameters: recentClickQueryParameters,
        security,
        responses: { "200": { description: "Analytics" } },
      },
    },
    "/v1/links/{id}/goals": {
      parameters: idParameter,
      put: {
        summary: "Set click milestones for a link",
        security,
        requestBody: {
          required: true,
          content: { "application/json": { schema: linkGoalsInput } },
        },
        responses: { "200": { description: "Updated milestones" } },
      },
    },
    "/v1/advertising": {
      get: {
        summary:
          "Get advertising interstitial settings for the authenticated link owner",
        security,
        responses: { "200": { description: "Advertising settings" } },
      },
      patch: {
        summary:
          "Update AdsTerra interstitial settings for the authenticated link owner",
        security,
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  enabled: { type: "boolean" },
                  automaticRedirect: {
                    type: "boolean",
                    description:
                      "When true, redirect after the visible-only countdown; when false, reveal the Continue to site button when it ends",
                    default: false,
                  },
                  delaySeconds: {
                    type: "integer",
                    minimum: 1,
                    maximum: 60,
                    default: 5,
                  },
                  banners: {
                    type: "array",
                    maxItems: 6,
                    items: {
                      type: "object",
                      required: ["preset", "script"],
                      properties: {
                        preset: {
                          type: "string",
                          enum: [
                            "468x60",
                            "160x300",
                            "320x50",
                            "728x90",
                            "160x600",
                            "300x250",
                          ],
                        },
                        script: {
                          type: "string",
                          description:
                            "AdsTerra invoke.js URL or the full copied AdsTerra snippet",
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: { "200": { description: "Updated advertising settings" } },
      },
    },
    "/v1/analytics/summary": {
      get: {
        summary: "Get account analytics",
        security,
        responses: { "200": { description: "Summary" } },
      },
    },
    "/v1/registration": {
      get: {
        summary: "Get public registration availability",
        responses: { "200": { description: "Registration status" } },
      },
    },
    "/v1/auth/status": {
      get: {
        summary: "Get enabled browser authentication methods",
        responses: { "200": { description: "Authentication status" } },
      },
    },
    "/v1/settings": {
      get: {
        summary: "Get application settings (administrator only)",
        security: sessionSecurity,
        responses: {
          "200": { description: "Settings" },
          "403": { description: "Administrator access required" },
        },
      },
      patch: {
        summary:
          "Update application settings and notification destinations (administrator only)",
        security: sessionSecurity,
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  registrationEnabled: { type: "boolean" },
                  discordWebhookUrl: {
                    type: ["string", "null"],
                    format: "uri",
                  },
                  telegramBotToken: { type: ["string", "null"] },
                  telegramChatId: { type: ["string", "null"] },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Updated settings" },
          "403": { description: "Administrator access required" },
        },
      },
    },
    "/v1/api-keys": {
      get: {
        summary: "List API keys (session only)",
        security: sessionSecurity,
        responses: { "200": { description: "API keys" } },
      },
      post: {
        summary: "Create API key (session only)",
        security: sessionSecurity,
        responses: { "201": { description: "Key secret is returned once" } },
      },
    },
    "/v1/api-keys/{id}": {
      parameters: idParameter,
      delete: {
        summary: "Delete API key (session only)",
        security: sessionSecurity,
        responses: { "204": { description: "Deleted" } },
      },
    },
  },
  components: {
    securitySchemes: {
      apiKey: { type: "apiKey", in: "header", name: "x-api-key" },
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "better-auth.session_token",
      },
    },
    schemas: { Link: link },
  },
} as const
