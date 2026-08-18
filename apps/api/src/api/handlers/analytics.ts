import {
  and,
  count,
  countDistinct,
  desc,
  eq,
  gte,
  isNotNull,
  sql,
} from "drizzle-orm";
import { db } from "../../db";
import { linkClicks, shortLinks } from "../../db/schema";
import type { RecentClicksQuery } from "../../schemas";

const number = (value: unknown) => Number(value ?? 0);

export const getLinkAnalytics = async (
  id: string,
  { page = 1, pageSize = 10, country, device }: Partial<RecentClicksQuery> = {}
) => {
  const referrer = sql<string>`coalesce(nullif(${linkClicks.referrer}, ''), 'Direct')`;
  const recentClickConditions = [eq(linkClicks.linkId, id)];
  if (country) recentClickConditions.push(eq(linkClicks.country, country));
  if (device) recentClickConditions.push(eq(linkClicks.device, device));
  const recentClickWhere = and(...recentClickConditions);
  const [
    totals,
    seriesResult,
    referrers,
    countries,
    devices,
    recentClicks,
    recentClicksTotal,
  ] = await Promise.all([
    db
      .select({
        clicks: count(),
        uniqueVisitors: countDistinct(linkClicks.ipHash),
        clicksLast30Days: sql<number>`count(*) filter (where ${linkClicks.clickedAt} >= now() - interval '30 days')`,
      })
      .from(linkClicks)
      .where(eq(linkClicks.linkId, id)),
    db.execute(sql`
        SELECT to_char(day, 'YYYY-MM-DD') AS date, count(c.id)::int AS clicks
        FROM generate_series(current_date - 29, current_date, interval '1 day') day
        LEFT JOIN link_clicks c ON c.link_id = ${id}
          AND c.clicked_at >= day AND c.clicked_at < day + interval '1 day'
        GROUP BY day ORDER BY day
      `),
    db
      .select({ referrer, clicks: count() })
      .from(linkClicks)
      .where(eq(linkClicks.linkId, id))
      .groupBy(referrer)
      .orderBy(desc(count()))
      .limit(10),
    db
      .select({ country: linkClicks.country, clicks: count() })
      .from(linkClicks)
      .where(and(eq(linkClicks.linkId, id), isNotNull(linkClicks.country)))
      .groupBy(linkClicks.country)
      .orderBy(desc(count()))
      .limit(10),
    db
      .select({ device: linkClicks.device, clicks: count() })
      .from(linkClicks)
      .where(eq(linkClicks.linkId, id))
      .groupBy(linkClicks.device)
      .orderBy(desc(count())),
    db
      .select({
        id: linkClicks.id,
        clickedAt: linkClicks.clickedAt,
        referrer: linkClicks.referrer,
        userAgent: linkClicks.userAgent,
        country: linkClicks.country,
        device: linkClicks.device,
      })
      .from(linkClicks)
      .where(recentClickWhere)
      .orderBy(desc(linkClicks.clickedAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ count: count() }).from(linkClicks).where(recentClickWhere),
  ]);

  const total = totals[0];
  const recentClicksCount = number(recentClicksTotal[0]?.count);
  return {
    totals: {
      clicks: number(total.clicks),
      uniqueVisitors: number(total.uniqueVisitors),
      clicksLast30Days: number(total.clicksLast30Days),
    },
    series: seriesResult.rows as Array<{ date: string; clicks: number }>,
    referrers: referrers.map((row) => ({
      referrer: row.referrer,
      clicks: number(row.clicks),
    })),
    countries: countries.map((row) => ({
      country: row.country!,
      clicks: number(row.clicks),
    })),
    devices: devices.map((row) => ({
      device: row.device,
      clicks: number(row.clicks),
    })),
    recentClicks,
    recentClicksPagination: {
      page,
      pageSize,
      total: recentClicksCount,
      pageCount: Math.ceil(recentClicksCount / pageSize),
    },
  };
};

export const getAnalyticsSummary = async (userId: string) => {
  const [totals, recent, seriesResult, topLinks] = await Promise.all([
    db
      .select({
        links: count(),
        activeLinks: sql<number>`count(*) filter (where ${shortLinks.active} and (${shortLinks.expiresAt} is null or ${shortLinks.expiresAt} > now()))`,
        clicks: sql<number>`coalesce(sum(${shortLinks.clicks}), 0)`,
      })
      .from(shortLinks)
      .where(eq(shortLinks.userId, userId)),
    db
      .select({ clicks: count() })
      .from(linkClicks)
      .innerJoin(shortLinks, eq(linkClicks.linkId, shortLinks.id))
      .where(
        and(
          eq(shortLinks.userId, userId),
          gte(linkClicks.clickedAt, sql`now() - interval '30 days'`),
        ),
      ),
    db.execute(sql`
      SELECT to_char(day, 'YYYY-MM-DD') AS date, count(c.id)::int AS clicks
      FROM generate_series(current_date - 29, current_date, interval '1 day') day
      LEFT JOIN short_links l ON l.user_id = ${userId}
      LEFT JOIN link_clicks c ON c.link_id = l.id
        AND c.clicked_at >= day AND c.clicked_at < day + interval '1 day'
      GROUP BY day ORDER BY day
    `),
    db
      .select()
      .from(shortLinks)
      .where(eq(shortLinks.userId, userId))
      .orderBy(desc(shortLinks.clicks), desc(shortLinks.createdAt))
      .limit(5),
  ]);

  const total = totals[0];
  return {
    totals: {
      links: number(total.links),
      activeLinks: number(total.activeLinks),
      clicks: number(total.clicks),
      clicksLast30Days: number(recent[0]?.clicks),
    },
    series: seriesResult.rows as Array<{ date: string; clicks: number }>,
    topLinks,
  };
};
