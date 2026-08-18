export const ADSTERRA_BANNER_PRESETS = {
  "468x60": { width: 468, height: 60 },
  "160x300": { width: 160, height: 300 },
  "320x50": { width: 320, height: 50 },
  "728x90": { width: 728, height: 90 },
  "160x600": { width: 160, height: 600 },
  "300x250": { width: 300, height: 250 },
} as const

export const ADSTERRA_BANNER_PRESET_IDS = Object.keys(
  ADSTERRA_BANNER_PRESETS
) as [
  keyof typeof ADSTERRA_BANNER_PRESETS,
  ...(keyof typeof ADSTERRA_BANNER_PRESETS)[],
]

export type AdsterraBannerPreset = keyof typeof ADSTERRA_BANNER_PRESETS
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

export const defaultAdvertisingSettings: AdvertisingSettings = {
  enabled: false,
  automaticRedirect: false,
  delaySeconds: 5,
  provider: "adsterra",
  banners: [],
}

const adsterraHosts = new Set([
  "highperformanceformat.com",
  "www.highperformanceformat.com",
])

export const extractAdsterraScriptUrl = (value: string) => {
  const candidates = value.match(/https?:\/\/[^\s"'<>]+/g) ?? [value]

  for (const rawCandidate of candidates) {
    try {
      const url = new URL(rawCandidate.replace(/[),;]+$/, ""))
      const key = url.pathname.match(/^\/([a-f0-9]{32})\/invoke\.js$/i)?.[1]
      if (
        url.protocol === "https:" &&
        adsterraHosts.has(url.hostname.toLowerCase()) &&
        key
      ) {
        return `https://www.highperformanceformat.com/${key}/invoke.js`
      }
    } catch {
      // Try the next URL from a pasted snippet.
    }
  }

  return null
}

export const parseAdvertisingBanners = (
  value: unknown
): AdvertisingBanner[] => {
  if (!Array.isArray(value)) return []

  const banners: AdvertisingBanner[] = []
  for (const item of value) {
    if (!item || typeof item !== "object") continue
    const preset = (item as { preset?: unknown }).preset
    const scriptUrl = (item as { scriptUrl?: unknown }).scriptUrl
    if (
      typeof preset !== "string" ||
      !Object.hasOwn(ADSTERRA_BANNER_PRESETS, preset) ||
      typeof scriptUrl !== "string"
    ) {
      continue
    }
    const normalizedScriptUrl = extractAdsterraScriptUrl(scriptUrl)
    if (
      !normalizedScriptUrl ||
      banners.some((banner) => banner.preset === preset)
    ) {
      continue
    }
    banners.push({
      preset: preset as AdsterraBannerPreset,
      scriptUrl: normalizedScriptUrl,
    })
  }

  return banners
}
