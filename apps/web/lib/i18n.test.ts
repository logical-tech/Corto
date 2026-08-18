// @ts-expect-error Bun's test module is intentionally not part of the web bundle.
import { expect, test } from "bun:test"

import i18n, { defaultLocale, locales, namespaces, resources } from "./i18n"

test("uses English by default and interpolates JSON resources", async () => {
  await i18n.changeLanguage(defaultLocale)
  expect(i18n.t("dashboard", { ns: "common" })).toBe("Overview")

  await i18n.changeLanguage("it")
  expect(i18n.t("copyLink", { link: "sho.rt/a" })).toBe("Copia sho.rt/a")
  expect(i18n.t("missing-key", { ns: "common" })).toBe("missing-key")

  await i18n.changeLanguage(defaultLocale)
})

test("keeps every translated namespace aligned with English", () => {
  for (const locale of locales.filter((locale) => locale !== defaultLocale)) {
    for (const namespace of namespaces) {
      expect(Object.keys(resources[locale][namespace]).sort()).toEqual(
        Object.keys(resources.en[namespace]).sort()
      )
    }
  }
})
