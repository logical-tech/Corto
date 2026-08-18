import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import {
  authStatusController,
  getSettingsController,
  registrationController,
  updateSettingsController,
} from "../controllers/settings";
import { requireAdmin } from "../middleware";
import type { AppEnv } from "../types";
import { updateSettingsSchema } from "../../schemas";

export const settingsRouter = new Hono<AppEnv>()
  .get("/registration", registrationController)
  .get("/auth/status", authStatusController)
  .get("/settings", requireAdmin, getSettingsController)
  .patch(
    "/settings",
    requireAdmin,
    zValidator("json", updateSettingsSchema, (result, c) =>
      result.success
        ? undefined
        : c.json(
            { message: result.error.issues[0]?.message ?? "Invalid request" },
            400
          )
    ),
    (c) => updateSettingsController(c, c.req.valid("json"))
  );
