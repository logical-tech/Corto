import { and, eq, isNull, lte, sql } from "drizzle-orm"
import { db } from "../../db"
import { linkClicks, linkGoals, shortLinks } from "../../db/schema"
import { dropCachedLink } from "./links"
import { notifyGoalMilestones } from "./notifications"

type ClickInput = {
  linkId: string
  ipHash: string
  referrer: string | null
  userAgent: string | null
  country: string | null
  device: string
}

export const recordClick = async (input: ClickInput) => {
  const result = await db.transaction(async (tx) => {
    await tx.insert(linkClicks).values(input)
    const [link] = await tx
      .update(shortLinks)
      .set({
        clicks: sql`${shortLinks.clicks} + 1`,
        lastClickedAt: new Date(),
      })
      .where(eq(shortLinks.id, input.linkId))
      .returning({
        slug: shortLinks.slug,
        clicks: shortLinks.clicks,
        clickLimit: shortLinks.clickLimit,
      })
    if (!link) return null

    // The click that reaches the limit is still served; the next one is not.
    const limitReached =
      link.clickLimit !== null && link.clicks >= link.clickLimit
    if (limitReached) {
      await tx
        .update(shortLinks)
        .set({ active: false })
        .where(eq(shortLinks.id, input.linkId))
    }

    const milestones = await tx
      .update(linkGoals)
      .set({ reachedAt: new Date() })
      .where(
        and(
          eq(linkGoals.linkId, input.linkId),
          isNull(linkGoals.reachedAt),
          lte(linkGoals.clicks, link.clicks)
        )
      )
      .returning({ clicks: linkGoals.clicks })
    return { link, milestones, limitReached }
  })

  if (result?.limitReached) await dropCachedLink(result.link.slug)

  if (result?.milestones.length) {
    // ponytail: in-process delivery; add an outbox worker if retryable delivery guarantees are needed.
    await notifyGoalMilestones({
      slug: result.link.slug,
      milestones: result.milestones,
    })
  }
}
