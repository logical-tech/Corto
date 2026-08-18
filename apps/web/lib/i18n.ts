import i18n from "i18next"
import { initReactI18next } from "react-i18next"

import enApiKeys from "@/locales/en/apiKeys.json"
import enAuth from "@/locales/en/auth.json"
import enCommon from "@/locales/en/common.json"
import enDashboard from "@/locales/en/dashboard.json"
import enDocs from "@/locales/en/docs.json"
import enLanding from "@/locales/en/landing.json"
import enLinks from "@/locales/en/links.json"
import enSettings from "@/locales/en/settings.json"
import deApiKeys from "@/locales/de/apiKeys.json"
import deAuth from "@/locales/de/auth.json"
import deCommon from "@/locales/de/common.json"
import deDashboard from "@/locales/de/dashboard.json"
import deDocs from "@/locales/de/docs.json"
import deLanding from "@/locales/de/landing.json"
import deLinks from "@/locales/de/links.json"
import deSettings from "@/locales/de/settings.json"
import esApiKeys from "@/locales/es/apiKeys.json"
import esAuth from "@/locales/es/auth.json"
import esCommon from "@/locales/es/common.json"
import esDashboard from "@/locales/es/dashboard.json"
import esDocs from "@/locales/es/docs.json"
import esLanding from "@/locales/es/landing.json"
import esLinks from "@/locales/es/links.json"
import esSettings from "@/locales/es/settings.json"
import frApiKeys from "@/locales/fr/apiKeys.json"
import frAuth from "@/locales/fr/auth.json"
import frCommon from "@/locales/fr/common.json"
import frDashboard from "@/locales/fr/dashboard.json"
import frDocs from "@/locales/fr/docs.json"
import frLanding from "@/locales/fr/landing.json"
import frLinks from "@/locales/fr/links.json"
import frSettings from "@/locales/fr/settings.json"
import itApiKeys from "@/locales/it/apiKeys.json"
import itAuth from "@/locales/it/auth.json"
import itCommon from "@/locales/it/common.json"
import itDashboard from "@/locales/it/dashboard.json"
import itDocs from "@/locales/it/docs.json"
import itLanding from "@/locales/it/landing.json"
import itLinks from "@/locales/it/links.json"
import itSettings from "@/locales/it/settings.json"
import jaApiKeys from "@/locales/ja/apiKeys.json"
import jaAuth from "@/locales/ja/auth.json"
import jaCommon from "@/locales/ja/common.json"
import jaDashboard from "@/locales/ja/dashboard.json"
import jaDocs from "@/locales/ja/docs.json"
import jaLanding from "@/locales/ja/landing.json"
import jaLinks from "@/locales/ja/links.json"
import jaSettings from "@/locales/ja/settings.json"
import ptApiKeys from "@/locales/pt/apiKeys.json"
import ptAuth from "@/locales/pt/auth.json"
import ptCommon from "@/locales/pt/common.json"
import ptDashboard from "@/locales/pt/dashboard.json"
import ptDocs from "@/locales/pt/docs.json"
import ptLanding from "@/locales/pt/landing.json"
import ptLinks from "@/locales/pt/links.json"
import ptSettings from "@/locales/pt/settings.json"
import zhApiKeys from "@/locales/zh/apiKeys.json"
import zhAuth from "@/locales/zh/auth.json"
import zhCommon from "@/locales/zh/common.json"
import zhDashboard from "@/locales/zh/dashboard.json"
import zhDocs from "@/locales/zh/docs.json"
import zhLanding from "@/locales/zh/landing.json"
import zhLinks from "@/locales/zh/links.json"
import zhSettings from "@/locales/zh/settings.json"

export const locales = ["en", "it", "fr", "de", "es", "pt", "zh", "ja"] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = "en"
export const languageKeys: Record<Locale, string> = {
  en: "english",
  it: "italian",
  fr: "french",
  de: "german",
  es: "spanish",
  pt: "portuguese",
  zh: "chinese",
  ja: "japanese",
}

export const namespaces = [
  "common",
  "dashboard",
  "links",
  "settings",
  "apiKeys",
  "auth",
  "docs",
  "landing",
] as const

export const resources = {
  de: {
    common: deCommon,
    dashboard: deDashboard,
    links: deLinks,
    settings: deSettings,
    apiKeys: deApiKeys,
    auth: deAuth,
    docs: deDocs,
    landing: deLanding,
  },
  en: {
    common: enCommon,
    dashboard: enDashboard,
    links: enLinks,
    settings: enSettings,
    apiKeys: enApiKeys,
    auth: enAuth,
    docs: enDocs,
    landing: enLanding,
  },
  es: {
    common: esCommon,
    dashboard: esDashboard,
    links: esLinks,
    settings: esSettings,
    apiKeys: esApiKeys,
    auth: esAuth,
    docs: esDocs,
    landing: esLanding,
  },
  fr: {
    common: frCommon,
    dashboard: frDashboard,
    links: frLinks,
    settings: frSettings,
    apiKeys: frApiKeys,
    auth: frAuth,
    docs: frDocs,
    landing: frLanding,
  },
  it: {
    common: itCommon,
    dashboard: itDashboard,
    links: itLinks,
    settings: itSettings,
    apiKeys: itApiKeys,
    auth: itAuth,
    docs: itDocs,
    landing: itLanding,
  },
  ja: {
    common: jaCommon,
    dashboard: jaDashboard,
    links: jaLinks,
    settings: jaSettings,
    apiKeys: jaApiKeys,
    auth: jaAuth,
    docs: jaDocs,
    landing: jaLanding,
  },
  pt: {
    common: ptCommon,
    dashboard: ptDashboard,
    links: ptLinks,
    settings: ptSettings,
    apiKeys: ptApiKeys,
    auth: ptAuth,
    docs: ptDocs,
    landing: ptLanding,
  },
  zh: {
    common: zhCommon,
    dashboard: zhDashboard,
    links: zhLinks,
    settings: zhSettings,
    apiKeys: zhApiKeys,
    auth: zhAuth,
    docs: zhDocs,
    landing: zhLanding,
  },
} as const

void i18n.use(initReactI18next).init({
  resources,
  lng: defaultLocale,
  fallbackLng: defaultLocale,
  supportedLngs: locales,
  ns: namespaces,
  defaultNS: "common",
  fallbackNS: "common",
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
  returnNull: false,
})

export default i18n
