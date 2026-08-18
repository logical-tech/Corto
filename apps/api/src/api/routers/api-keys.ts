import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import {
  createApiKeyController,
  deleteApiKeyController,
  listApiKeysController,
} from "../controllers/api-keys";
import { requireSession } from "../middleware";
import type { AppEnv } from "../types";
import { createApiKeySchema } from "../../schemas";

export const apiKeysRouter = new Hono<AppEnv>()
  .get("/", requireSession, listApiKeysController)
  .post(
    "/",
    requireSession,
    zValidator("json", createApiKeySchema, (result, c) =>
      result.success
        ? undefined
        : c.json({ message: result.error.issues[0]?.message ?? "Invalid request" }, 400),
    ),
    (c) => createApiKeyController(c, c.req.valid("json")),
  )
  .delete("/:id", requireSession, (c) =>
    deleteApiKeyController(c, c.req.param("id")),
  );
