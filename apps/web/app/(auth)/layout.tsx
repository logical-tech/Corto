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
      className="min-h-svh bg-card lg:grid lg:grid-cols-[minmax(24rem,0.94fr)_minmax(34rem,1.06fr)]"
    >
      <aside className="relative overflow-hidden bg-foreground px-5 py-6 text-background sm:px-8 sm:py-8 lg:min-h-svh lg:px-12 lg:py-12">
        <div className="relative flex h-full min-h-72 flex-col justify-between gap-12 lg:min-h-0">
          <Brand />

          <div className="max-w-lg lg:pb-10">
            <p className="max-w-[13ch] text-4xl leading-[0.98] font-semibold tracking-[-0.04em] text-balance sm:text-5xl lg:text-6xl">
              {t("authTagline")}
            </p>
            <p className="mt-5 max-w-[48ch] text-sm leading-6 text-background/65">
              {t("authDescription")}
            </p>
          </div>

          <div
            className="max-w-xl border-t border-background/15 pt-5"
            aria-hidden="true"
          >
            <div className="flex items-center justify-between gap-4 font-mono text-xs tracking-[0.08em] text-background/50 uppercase">
              <span>origin</span>
              <span>short link</span>
            </div>
            <svg
              className="mt-3 h-auto w-full max-w-xl"
              viewBox="0 0 560 96"
              fill="none"
            >
              <path
                className="routing-path"
                pathLength="1"
                d="M12 22H170C223 22 219 74 287 74H429C470 74 475 34 548 34"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                opacity=".68"
              />
              <circle cx="12" cy="22" r="6" fill="var(--signal)" />
              <circle cx="548" cy="34" r="6" fill="currentColor" />
            </svg>
          </div>
        </div>
      </aside>

      <section className="flex min-w-0 flex-col px-5 py-6 sm:px-8 sm:py-8 lg:min-h-svh lg:px-12 lg:py-12">
        <div className="flex items-center justify-end gap-1">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
        <div className="w-full max-w-md pt-14 sm:pt-20 lg:pt-[clamp(5rem,15vh,11rem)] lg:pl-[clamp(1rem,5vw,5rem)]">
          {children}
        </div>
      </section>
    </main>
  )
}
