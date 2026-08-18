import { eq } from "drizzle-orm"
import {
  defaultAdvertisingSettings,
  parseAdvertisingBanners,
  type AdvertisingSettings,
} from "../../advertising"
import { db } from "../../db"
import { advertisingSettings } from "../../db/schema"
import { redis, redisKey } from "../../redis"
import type { UpdateAdvertisingSettingsInput } from "../../schemas"

const parseStoredBanners = (value: string | undefined) => {
  try {
    return parseAdvertisingBanners(value ? JSON.parse(value) : [])
  } catch {
    return []
  }
}

const presentAdvertisingSettings = (
  row: typeof advertisingSettings.$inferSelect | undefined
): AdvertisingSettings => ({
  enabled: row?.enabled === true,
  automaticRedirect: row?.automaticRedirect === true,
  delaySeconds: row?.delaySeconds ?? defaultAdvertisingSettings.delaySeconds,
  provider: "adsterra",
  banners: parseStoredBanners(row?.adsterraBanners),
})

const cacheAdvertisingSettings = async (
  userId: string,
  settings: AdvertisingSettings
) => {
  try {
    await redis.set(
      redisKey("advertising", userId),
      JSON.stringify(settings),
      "EX",
      3600
    )
  } catch {
    // PostgreSQL remains authoritative when Redis is unavailable.
  }
}

const selectAdvertisingSettings = async (userId: string) => {
  const [row] = await db
    .select()
    .from(advertisingSettings)
    .where(eq(advertisingSettings.userId, userId))
  return row
}

export const getAdvertisingSettings = async (userId: string) =>
  presentAdvertisingSettings(await selectAdvertisingSettings(userId))

export const resolveAdvertisingSettings = async (
  userId: string
): Promise<AdvertisingSettings> => {
  try {
    const cached = await redis.get(redisKey("advertising", userId))
    if (cached) {
      const value = JSON.parse(cached) as Partial<AdvertisingSettings>
      if (
        typeof value.enabled === "boolean" &&
        typeof value.automaticRedirect === "boolean" &&
        typeof value.delaySeconds === "number" &&
        value.provider === "adsterra"
      ) {
        return {
          enabled: value.enabled,
          automaticRedirect: value.automaticRedirect,
          delaySeconds: value.delaySeconds,
          provider: "adsterra",
          banners: parseAdvertisingBanners(value.banners),
        }
      }
    }
  } catch {
    // Fall through to PostgreSQL.
  }

  const settings = await getAdvertisingSettings(userId)
  await cacheAdvertisingSettings(userId, settings)
  return settings
}

export const updateAdvertisingSettings = async (
  userId: string,
  data: UpdateAdvertisingSettingsInput
) => {
  const current = await getAdvertisingSettings(userId)
  const next = {
    enabled: data.enabled ?? current.enabled,
    automaticRedirect: data.automaticRedirect ?? current.automaticRedirect,
    delaySeconds: data.delaySeconds ?? current.delaySeconds,
    banners: data.banners ?? current.banners,
  }
  const [row] = await db
    .insert(advertisingSettings)
    .values({
      userId,
      enabled: next.enabled,
      automaticRedirect: next.automaticRedirect,
      delaySeconds: next.delaySeconds,
      provider: "adsterra",
      adsterraBanners: JSON.stringify(next.banners),
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: advertisingSettings.userId,
      set: {
        enabled: next.enabled,
        automaticRedirect: next.automaticRedirect,
        delaySeconds: next.delaySeconds,
        provider: "adsterra",
        adsterraBanners: JSON.stringify(next.banners),
        updatedAt: new Date(),
      },
    })
    .returning()
  const settings = presentAdvertisingSettings(row)
  await cacheAdvertisingSettings(userId, settings)
  return settings
}
