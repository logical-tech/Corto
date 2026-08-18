"use client"

import { buttonVariants } from "@workspace/ui/components/button"
import Link from "next/link"
import { useTranslation } from "react-i18next"

import { DocumentationContent } from "@/app/(console)/dashboard/docs/page"
import { Brand } from "@/components/brand"
import { LanguageSwitcher } from "@/components/language-switcher"

export default function DocsPage() {
  const { t } = useTranslation("common")

  return (
    <main id="main-content" tabIndex={-1}>
      <header className="border-b">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Brand />
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Link
              href="/login"
              className={`${buttonVariants({ variant: "ghost", size: "lg" })} max-sm:!hidden`}
            >
              {t("signIn")}
            </Link>
            <Link
              href="/register"
              className={`${buttonVariants({ size: "lg" })} max-sm:!hidden`}
            >
              {t("getStarted")}
            </Link>
          </div>
        </div>
      </header>
      <div className="px-5 py-14 sm:px-8 lg:py-20">
        <DocumentationContent />
      </div>
    </main>
  )
}
