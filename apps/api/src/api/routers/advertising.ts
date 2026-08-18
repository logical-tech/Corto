import { zValidator } from "@hono/zod-validator"
import { Hono } from "hono"
import {
  getAdvertisingSettingsController,
  updateAdvertisingSettingsController,
} from "../controllers/advertising"
import { requireAuth } from "../middleware"
import { updateAdvertisingSettingsSchema } from "../../schemas"
import type { AppEnv } from "../types"

export const advertisingRouter = new Hono<AppEnv>()
  .get("/", requireAuth("read"), getAdvertisingSettingsController)
  .patch(
    "/",
    requireAuth("write"),
    zValidator("json", updateAdvertisingSettingsSchema, (result, c) =>
      result.success
        ? undefined
        : c.json(
            { message: result.error.issues[0]?.message ?? "Invalid request" },
            400
          )
    ),
    (c) => updateAdvertisingSettingsController(c, c.req.valid("json"))
  )
