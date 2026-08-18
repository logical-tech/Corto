import { Hono } from "hono";
import { analyticsSummaryController } from "../controllers/analytics";
import { requireAuth } from "../middleware";
import type { AppEnv } from "../types";

export const analyticsRouter = new Hono<AppEnv>().get(
  "/summary",
  requireAuth("read"),
  analyticsSummaryController,
);
