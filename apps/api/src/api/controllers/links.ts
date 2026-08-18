import type { Context } from "hono";
import type {
  CreateLinkInput,
  RecentClicksQuery,
  UpdateLinkGoalsInput,
  UpdateLinkInput,
} from "../../schemas";
import { getLinkAnalytics } from "../handlers/analytics";
import { listLinkGoals, replaceOwnedLinkGoals } from "../handlers/goals";
import {
  createLink,
  deleteOwnedLink,
  getOwnedLink,
  listLinks,
  updateOwnedLink,
} from "../handlers/links";
import { presentLink } from "../presenters";
import type { AppEnv } from "../types";

export const listLinksController = async (c: Context<AppEnv>) => {
  const links = await listLinks(c.var.principal.userId);
  return c.json({ links: links.map(presentLink) });
};

export const createLinkController = async (
  c: Context<AppEnv>,
  data: CreateLinkInput,
) => {
  const link = await createLink(c.var.principal.userId, data);
  return c.json({ link: presentLink(link) }, 201);
};

export const getLinkController = async (
  c: Context<AppEnv>,
  id: string,
  query?: RecentClicksQuery,
) => {
  const link = await getOwnedLink(id, c.var.principal.userId);
  if (!link) return c.json({ message: "Link not found" }, 404);
  return c.json({
    link: presentLink(link),
    analytics: await getLinkAnalytics(link.id, query),
    goals: await listLinkGoals(link.id),
  });
};

export const updateLinkGoalsController = async (
  c: Context<AppEnv>,
  id: string,
  data: UpdateLinkGoalsInput
) => {
  const goals = await replaceOwnedLinkGoals(id, c.var.principal.userId, data);
  return goals ? c.json({ goals }) : c.json({ message: "Link not found" }, 404);
};

export const updateLinkController = async (
  c: Context<AppEnv>,
  id: string,
  data: UpdateLinkInput,
) => {
  const link = await updateOwnedLink(id, c.var.principal.userId, data);
  if (!link) return c.json({ message: "Link not found" }, 404);
  return c.json({ link: presentLink(link) });
};

export const deleteLinkController = async (c: Context<AppEnv>, id: string) => {
  const deleted = await deleteOwnedLink(id, c.var.principal.userId);
  return deleted
    ? c.body(null, 204)
    : c.json({ message: "Link not found" }, 404);
};
