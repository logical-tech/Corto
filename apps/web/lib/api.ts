export const API_URL = "/api"

export type ShortLink = {
  id: string
  slug: string
  url: string
  title?: string | null
  shortUrl: string
  active: boolean
  adFree: boolean
  expiresAt: string | null
  clickLimit: number | null
  hasPassword: boolean
  clicks: number
  lastClickedAt?: string | null
  createdAt: string
  updatedAt: string
}

export type TimePoint = { date: string; clicks: number }

export type LinkAnalytics = {
  totals: {
    clicks: number
    uniqueVisitors: number
    clicksLast30Days: number
  }
  series: TimePoint[]
  referrers: Array<{ referrer: string; clicks: number }>
  countries: Array<{ country: string; clicks: number }>
  devices: Array<{ device: string; clicks: number }>
  recentClicks: Array<{
    id: number
    clickedAt: string
    referrer: string | null
    userAgent: string | null
    country: string | null
    device: string | null
  }>
  recentClicksPagination: {
    page: number
    pageSize: number
    total: number
    pageCount: number
  }
}

export type LinkGoal = {
  id: string
  clicks: number
  reachedAt: string | null
  createdAt: string
}

export type AnalyticsSummary = {
  totals: {
    clicks: number
    links: number
    activeLinks: number
    clicksLast30Days: number
  }
  series: TimePoint[]
  topLinks: Array<
    Pick<ShortLink, "id" | "slug" | "title" | "url" | "shortUrl" | "clicks">
  >
}

export type ApiKey = {
  id: string
  name: string
  prefix?: string
  start?: string
  lastFour?: string
  createdAt: string
  lastUsedAt?: string | null
  expiresAt?: string | null
  permissions?: string[]
  key?: string
}

export type AppSettings = {
  registrationEnabled: boolean
  discordConfigured: boolean
  telegramConfigured: boolean
}

export const adsterraBannerPresets = [
  { id: "468x60", width: 468, height: 60 },
  { id: "160x300", width: 160, height: 300 },
  { id: "320x50", width: 320, height: 50 },
  { id: "728x90", width: 728, height: 90 },
  { id: "160x600", width: 160, height: 600 },
  { id: "300x250", width: 300, height: 250 },
] as const

export type AdsterraBannerPreset = (typeof adsterraBannerPresets)[number]["id"]
export type AdvertisingBanner = {
  preset: AdsterraBannerPreset
  scriptUrl: string
}
export type AdvertisingSettings = {
  enabled: boolean
  automaticRedirect: boolean
  delaySeconds: number
  provider: "adsterra"
  banners: AdvertisingBanner[]
}
export type RegistrationStatus = { enabled: boolean }
export type AuthStatus = { passkeyEnabled: boolean }

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message)
  }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  })
  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "message" in payload
        ? String(payload.message)
        : `La richiesta non è riuscita (${response.status}).`
    throw new ApiError(message, response.status)
  }

  return payload as T
}

export const shortUrl = (link: Pick<ShortLink, "shortUrl">) => link.shortUrl
