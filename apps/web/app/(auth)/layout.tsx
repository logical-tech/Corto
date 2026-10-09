"use client"

import { useTranslation } from "react-i18next"
import { useEffect } from "react"

import { Brand } from "@/components/brand"
import { LanguageSwitcher } from "@/components/language-switcher"
import { ThemeToggle } from "@/components/theme-toggle"
import { authClient } from "@/lib/auth-client"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { t } = useTranslation("auth")
  const { data: session, isPending } = authClient.useSession()

  useEffect(() => {
    if (!isPending && session) window.location.replace("/dashboard")
  }, [isPending, session])

  if (session) return null

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="flex min-h-svh flex-col gap-8 bg-zinc-900 bg-[radial-gradient(ellipse_at_top,rgb(255_255_255/0.08),transparent_60%),linear-gradient(to_bottom,transparent,rgb(0_0_0/0.45))] px-4 py-6 sm:px-10 sm:py-10 lg:px-20 lg:pb-24"
    >
      <header className="flex items-center justify-between gap-4">
        <div className="[&_a]:text-white [&_a>span]:bg-white [&_a>span]:text-primary">
          <Brand />
        </div>
        <div className="flex items-center gap-1 rounded-xl bg-card p-1">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center">{children}</div>

      <p className="max-w-[32.5rem] text-xl leading-7 font-bold tracking-[-0.02em] text-white sm:text-[1.75rem] sm:leading-8">
        {t("authTagline")
          .split(/(?<=[.。])\s*/)
          .map((sentence) => (
            <span key={sentence} className="block">
              {sentence}
            </span>
          ))}
      </p>
    </main>
  )
}
