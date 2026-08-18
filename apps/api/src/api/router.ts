import { Hono } from "hono"
import { auth } from "../auth"
import { openapi } from "../openapi"
import { analyticsRouter } from "./routers/analytics"
import { advertisingRouter } from "./routers/advertising"
import { apiKeysRouter } from "./routers/api-keys"
import { linksRouter } from "./routers/links"
import { settingsRouter } from "./routers/settings"
import type { AppEnv } from "./types"

const v1 = new Hono<AppEnv>()
v1.route("/links", linksRouter)
v1.route("/analytics", analyticsRouter)
v1.route("/advertising", advertisingRouter)
v1.route("/api-keys", apiKeysRouter)
v1.route("/", settingsRouter)

export const apiRouter = new Hono<AppEnv>()
apiRouter.get("/health", (c) => c.json({ status: "ok" }))
apiRouter.get("/openapi.json", (c) => c.json(openapi))
apiRouter.all("/auth/*", (c) => auth.handler(c.req.raw))
apiRouter.route("/v1", v1)
