import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import {
  createLinkController,
  deleteLinkController,
  getLinkController,
  listLinksController,
  updateLinkController,
  updateLinkGoalsController,
} from "../controllers/links";
import { linkAnalyticsController } from "../controllers/analytics";
import { requireAuth } from "../middleware";
import type { AppEnv } from "../types";
import {
  createLinkSchema,
  recentClicksQuerySchema,
  updateLinkGoalsSchema,
  updateLinkSchema,
} from "../../schemas";

export const linksRouter = new Hono<AppEnv>()
  .get("/", requireAuth("read"), listLinksController)
  .post(
    "/",
    requireAuth("write"),
    zValidator("json", createLinkSchema, (result, c) =>
      result.success
        ? undefined
        : c.json(
            { message: result.error.issues[0]?.message ?? "Invalid request" },
            400
          )
    ),
    (c) => createLinkController(c, c.req.valid("json"))
  )
  .get(
    "/:id",
    requireAuth("read"),
    zValidator("query", recentClicksQuerySchema),
    (c) => getLinkController(c, c.req.param("id"), c.req.valid("query"))
  )
  .get(
    "/:id/analytics",
    requireAuth("read"),
    zValidator("query", recentClicksQuerySchema),
    (c) => linkAnalyticsController(c, c.req.param("id"), c.req.valid("query"))
  )
  .put(
    "/:id/goals",
    requireAuth("write"),
    zValidator("json", updateLinkGoalsSchema, (result, c) =>
      result.success
        ? undefined
        : c.json(
            { message: result.error.issues[0]?.message ?? "Invalid request" },
            400
          )
    ),
    (c) => updateLinkGoalsController(c, c.req.param("id"), c.req.valid("json"))
  )
  .patch(
    "/:id",
    requireAuth("write"),
    zValidator("json", updateLinkSchema, (result, c) =>
      result.success
        ? undefined
        : c.json(
            { message: result.error.issues[0]?.message ?? "Invalid request" },
            400
          )
    ),
    (c) => updateLinkController(c, c.req.param("id"), c.req.valid("json"))
  )
  .delete("/:id", requireAuth("write"), (c) =>
    deleteLinkController(c, c.req.param("id"))
  );
