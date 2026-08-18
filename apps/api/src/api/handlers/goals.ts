import { randomUUID } from "node:crypto";
import { and, asc, eq, notInArray } from "drizzle-orm";
import { db } from "../../db";
import { linkGoals, shortLinks } from "../../db/schema";
import type { UpdateLinkGoalsInput } from "../../schemas";

export const listLinkGoals = (linkId: string) =>
  db
    .select()
    .from(linkGoals)
    .where(eq(linkGoals.linkId, linkId))
    .orderBy(asc(linkGoals.clicks));

export const replaceOwnedLinkGoals = async (
  linkId: string,
  userId: string,
  { goals }: UpdateLinkGoalsInput
) =>
  db.transaction(async (tx) => {
    const [link] = await tx
      .select({ clicks: shortLinks.clicks })
      .from(shortLinks)
      .where(and(eq(shortLinks.id, linkId), eq(shortLinks.userId, userId)));
    if (!link) return null;

    const condition = goals.length
      ? and(eq(linkGoals.linkId, linkId), notInArray(linkGoals.clicks, goals))
      : eq(linkGoals.linkId, linkId);
    await tx.delete(linkGoals).where(condition);

    if (goals.length) {
      const reachedAt = new Date();
      await tx
        .insert(linkGoals)
        .values(
          goals.map((clicks) => ({
            id: randomUUID(),
            linkId,
            clicks,
            reachedAt: clicks <= link.clicks ? reachedAt : null,
          }))
        )
        .onConflictDoNothing();
    }

    return tx
      .select()
      .from(linkGoals)
      .where(eq(linkGoals.linkId, linkId))
      .orderBy(asc(linkGoals.clicks));
  });
