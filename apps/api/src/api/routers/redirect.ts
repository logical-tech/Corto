import { Hono } from "hono"
import { redirectController } from "../controllers/redirect"
import type { AppEnv } from "../types"

export const redirectRouter = new Hono<AppEnv>()
  .get("/:slug", (c) => redirectController(c, c.req.param("slug")))
  // Unlocking a password-protected link posts back to the same short URL.
  .post("/:slug", (c) => redirectController(c, c.req.param("slug")))
