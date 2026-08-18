const formatLocales: Record<string, string> = {
  de: "de-DE",
  en: "en-US",
  es: "es-ES",
  fr: "fr-FR",
  it: "it-IT",
  ja: "ja-JP",
  pt: "pt-PT",
  zh: "zh-CN",
}

const formatLocale = (locale: string) => formatLocales[locale] ?? "en-US"

export const formatNumber = (value = 0, locale = "en") =>
  new Intl.NumberFormat(formatLocale(locale)).format(value)

export const formatDate = (value?: string | null, locale = "en") =>
  value
    ? new Intl.DateTimeFormat(formatLocale(locale), {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(new Date(value))
    : "—"

export const formatChartDate = (value: string, locale = "en") =>
  new Intl.DateTimeFormat(formatLocale(locale), {
    day: "2-digit",
    month: "short",
  }).format(new Date(value))
