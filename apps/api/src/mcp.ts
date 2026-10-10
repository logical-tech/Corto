import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js"
import type { Context } from "hono"
import { z } from "zod"
import { auth } from "./auth"

// Calls a /api/v1 route in-process, so every tool goes through the same
// auth, validation and ownership checks as the public REST API.
type V1Request = (path: string, init: RequestInit) => Promise<Response> | Response

const id = z.string().describe("Link id (from list_links or create_link)")
const linkFields = {
  title: z.string().max(200).nullable().optional(),
  active: z.boolean().optional(),
  adFree: z.boolean().optional().describe("Skip the ad interstitial for this link"),
  expiresAt: z.string().nullable().optional().describe("ISO 8601 datetime with offset, or null"),
  clickLimit: z.number().int().min(1).nullable().optional(),
  password: z.string().min(4).max(128).nullable().optional(),
}
const clicksQuery = {
  page: z.number().int().min(1).optional(),
  pageSize: z.number().int().min(5).max(50).optional(),
  country: z.string().optional(),
  device: z.string().optional(),
}

const query = (params: Record<string, unknown>) => {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined)
  return entries.length
    ? `?${new URLSearchParams(entries.map(([k, v]) => [k, String(v)]))}`
    : ""
}

const createServer = (v1: V1Request, apiKey: string) => {
  const call = async (method: string, path: string, body?: unknown) => {
    const res = await v1(path, {
      method,
      headers: {
        "x-api-key": apiKey,
        ...(body === undefined ? {} : { "content-type": "application/json" }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    const text = await res.text()
    return {
      isError: !res.ok,
      content: [
        {
          type: "text" as const,
          text: res.ok ? text || "{}" : `HTTP ${res.status}: ${text}`,
        },
      ],
    }
  }
  const linkPath = (linkId: string, suffix = "") =>
    `/links/${encodeURIComponent(linkId)}${suffix}`

  const server = new McpServer({ name: "corto", version: "0.0.1" })

  server.registerTool(
    "create_link",
    {
      description: "Create a short URL. Returns the link including its public shortUrl.",
      inputSchema: {
        url: z.string().url().describe("Destination http(s) URL"),
        slug: z
          .string()
          .optional()
          .describe("Custom slug: 3-64 chars, lowercase letters, digits, dashes. Random if omitted."),
        ...linkFields,
      },
    },
    (args) => call("POST", "/links", args)
  )
  server.registerTool(
    "list_links",
    { description: "List all short links with click counts." },
    () => call("GET", "/links")
  )
  server.registerTool(
    "get_link",
    {
      description: "Get one link with its analytics and recent clicks.",
      inputSchema: { id, ...clicksQuery },
    },
    ({ id, ...q }) => call("GET", linkPath(id, query(q)))
  )
  server.registerTool(
    "update_link",
    {
      description: "Update a link: destination, slug, title, active, expiry, click limit, password.",
      inputSchema: { id, url: z.string().url().optional(), slug: z.string().optional(), ...linkFields },
    },
    ({ id, ...body }) => call("PATCH", linkPath(id), body)
  )
  server.registerTool(
    "delete_link",
    {
      description: "Permanently delete a link and its click history.",
      inputSchema: { id },
      annotations: { destructiveHint: true },
    },
    ({ id }) => call("DELETE", linkPath(id))
  )
  server.registerTool(
    "reset_link_stats",
    {
      description: "Reset a link's clicks to 0: deletes its click history and un-reaches its goals.",
      inputSchema: { id },
      annotations: { destructiveHint: true },
    },
    ({ id }) => call("POST", linkPath(id, "/reset-stats"))
  )
  server.registerTool(
    "set_link_goals",
    {
      description: "Replace the click milestones (goals) of a link.",
      inputSchema: { id, goals: z.array(z.number().int().min(1)).max(20) },
    },
    ({ id, goals }) => call("PUT", linkPath(id, "/goals"), { goals })
  )
  server.registerTool(
    "link_analytics",
    {
      description: "Click analytics for one link: countries, devices, referrers, recent clicks.",
      inputSchema: { id, ...clicksQuery },
    },
    ({ id, ...q }) => call("GET", linkPath(id, `/analytics${query(q)}`))
  )
  server.registerTool(
    "analytics_summary",
    { description: "Account-wide click analytics summary." },
    () => call("GET", "/analytics/summary")
  )
  server.registerTool(
    "get_advertising",
    { description: "Read the Adsterra advertising settings." },
    () => call("GET", "/advertising")
  )
  server.registerTool(
    "update_advertising",
    {
      description: "Update advertising settings: enable ads, automatic redirect, delay, banners.",
      inputSchema: {
        enabled: z.boolean().optional(),
        automaticRedirect: z.boolean().optional(),
        delaySeconds: z.number().int().min(1).max(60).optional(),
        banners: z
          .array(
            z.object({
              preset: z.string(),
              script: z.string().describe("Adsterra invoke.js URL or snippet"),
            })
          )
          .max(6)
          .optional(),
      },
    },
    (args) => call("PATCH", "/advertising", args)
  )
  return server
}

export const mcpHandler = (v1: V1Request) => async (c: Context) => {
  const apiKey =
    c.req.header("x-api-key") ??
    c.req.header("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1]
  const result = apiKey
    ? await auth.api.verifyApiKey({ body: { key: apiKey, permissions: { links: ["read"] } } })
    : null
  if (!apiKey || !result?.valid) {
    return c.json({ message: "A valid API key is required (x-api-key or Authorization: Bearer)" }, 401)
  }
  // Stateless: a fresh server and transport per request, nothing kept in memory.
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  })
  await createServer(v1, apiKey).connect(transport)
  return transport.handleRequest(c.req.raw)
}
