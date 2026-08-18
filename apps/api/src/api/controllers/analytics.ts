import type { Context } from "hono";
import { getAnalyticsSummary, getLinkAnalytics } from "../handlers/analytics";
import { getOwnedLink } from "../handlers/links";
import { presentLink } from "../presenters";
import type { AppEnv } from "../types";
import type { RecentClicksQuery } from "../../schemas";

export const linkAnalyticsController = async (
  c: Context<AppEnv>,
  id: string,
  query?: RecentClicksQuery,
) => {
  const link = await getOwnedLink(id, c.var.principal.userId);
  if (!link) return c.json({ message: "Link not found" }, 404);
  return c.json(await getLinkAnalytics(link.id, query));
};

export const analyticsSummaryController = async (c: Context<AppEnv>) => {
  const summary = await getAnalyticsSummary(c.var.principal.userId);
  return c.json({
    ...summary,
    topLinks: summary.topLinks.map(presentLink),
  });
};
