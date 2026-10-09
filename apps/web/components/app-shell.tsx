"use client"

import { useQuery } from "@tanstack/react-query"
import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@workspace/ui/components/sidebar"
import { Skeleton } from "@workspace/ui/components/skeleton"
import {
  BookOpenIcon,
  ChartColumnIcon,
  CircleUserRoundIcon,
  KeyRoundIcon,
  Link2Icon,
  LogOutIcon,
  MenuIcon,
  SearchIcon,
  SettingsIcon,
  SparklesIcon,
  UsersRoundIcon,
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, type CSSProperties, type FormEvent } from "react"
import { useTranslation } from "react-i18next"

import { Brand } from "@/components/brand"
import { LanguageSwitcher } from "@/components/language-switcher"
import { PageTransition } from "@/components/page-transition"
import { QuickLinkCapture } from "@/components/quick-link-capture"
import { ThemeToggle } from "@/components/theme-toggle"
import { api, type AppSettings } from "@/lib/api"
import { authClient } from "@/lib/auth-client"

const navigation = [
  { href: "/dashboard", label: "dashboard", icon: ChartColumnIcon },
  { href: "/links", label: "links", icon: Link2Icon },
  { href: "/api-keys", label: "apiKeys", icon: KeyRoundIcon },
  { href: "/dashboard/docs", label: "documentation", icon: BookOpenIcon },
  { href: "/account", label: "account", icon: CircleUserRoundIcon },
]
const usersItem = { href: "/users", label: "users", icon: UsersRoundIcon }
const settingsItem = { href: "/settings", label: "settings", icon: SettingsIcon }

export function AppShell({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation("common")
  const pathname = usePathname()
  const router = useRouter()
  const { data: session, isPending } = authClient.useSession()
  const settings = useQuery({
    queryKey: ["settings"],
    queryFn: ({ signal }) => api<AppSettings>("/v1/settings", { signal }),
    enabled: Boolean(session),
    retry: false,
  })
  const navigationItems = settings.isSuccess
    ? [...navigation, usersItem, settingsItem]
    : [...navigation, settingsItem]
  // Longest matching prefix wins, so /dashboard/docs is Documentation, not Overview.
  const activeItem = navigationItems
    .filter(
      (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
    )
    .sort((a, b) => b.href.length - a.href.length)[0]

  useEffect(() => {
    if (!isPending && !session) router.replace("/login")
  }, [isPending, router, session])

  if (isPending || !session) {
    return (
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto flex min-h-svh max-w-6xl flex-col gap-6 p-6 sm:p-10"
      >
        <Skeleton className="h-10 w-44" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-80 w-full" />
      </main>
    )
  }

  const initial = (session.user.name || session.user.email)
    .charAt(0)
    .toUpperCase()

  async function signOut() {
    await authClient.signOut()
    router.replace("/login")
    router.refresh()
  }

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const query = String(new FormData(event.currentTarget).get("q")).trim()
    router.push(query ? `/links?q=${encodeURIComponent(query)}` : "/links")
  }

  return (
    <SidebarProvider
      className="h-svh overflow-hidden"
      style={
        {
          "--sidebar-width": "16.5rem",
          "--sidebar-width-icon": "4.5rem",
        } as CSSProperties
      }
    >
      <QuickLinkCapture />
      <Sidebar collapsible="icon">
        <SidebarHeader className="px-4 pt-7 pb-0">
          <div className="overflow-hidden px-3 pb-7 group-data-[collapsible=icon]:px-0.75">
            <Brand href="/dashboard" />
          </div>
        </SidebarHeader>
        <SidebarContent className="px-4">
          <SidebarGroup className="p-0">
            <SidebarGroupLabel className="h-auto px-0 pb-1 text-xs font-semibold tracking-[0.2px] text-subtle-foreground">
              {t("workspace")}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {navigationItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      render={<Link href={item.href} />}
                      tooltip={t(item.label)}
                      isActive={item === activeItem}
                      className="h-10.5 gap-3.5 rounded-xl px-3 text-[15px] font-medium text-muted-foreground has-[>svg:first-child]:pl-3 group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:p-2.5! data-active:font-semibold data-active:text-foreground"
                    >
                      <item.icon className="size-5!" />
                      <span>{t(item.label)}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="gap-0 px-4 pt-4 pb-6">
          <div className="flex flex-col gap-1.5 rounded-2xl bg-muted p-4 group-data-[collapsible=icon]:hidden">
            <SparklesIcon aria-hidden="true" className="size-5 text-primary" />
            <p className="text-sm font-semibold">{t("selfHosted")}</p>
            <p className="text-[13px] leading-[18px] text-muted-foreground">
              {t("selfHostedDescription")}
            </p>
          </div>
          <div className="mt-px flex items-center gap-3 border-t border-sidebar-border px-2 pt-4 group-data-[collapsible=icon]:mt-0 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:border-t-0 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:pt-0">
            <span
              aria-hidden="true"
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-foreground font-semibold text-background"
            >
              {initial}
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5 group-data-[collapsible=icon]:hidden">
              <p className="truncate text-sm font-semibold">
                {session.user.name}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {session.user.email}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full text-muted-foreground"
              aria-label={t("signOut")}
              title={t("signOut")}
              onClick={signOut}
            >
              <LogOutIcon aria-hidden="true" className="size-4.5" />
            </Button>
          </div>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset className="h-svh min-h-0 min-w-0 overflow-hidden">
        <header className="flex h-20 shrink-0 items-center gap-3 border-b border-border-soft bg-background px-4 sm:px-6 lg:px-10">
          <div className="flex min-w-0 flex-1 basis-0 items-center gap-2">
            <SidebarTrigger
              aria-label={t("toggleSidebar")}
              className="size-10 shrink-0 text-muted-foreground [&_svg]:size-5"
            />
            <span className="truncate text-[15px] font-semibold">
              {activeItem ? t(activeItem.label) : "Corto"}
            </span>
          </div>
          <form
            role="search"
            onSubmit={search}
            className="hidden h-13 w-full max-w-100 min-w-0 items-center gap-3 rounded-full bg-background py-0 pr-2 pl-6 shadow-[0_1px_2px_rgb(0_0_0/0.08),0_4px_12px_rgb(0_0_0/0.05)] ring-1 ring-border focus-within:ring-2 focus-within:ring-ring md:flex"
          >
            <label className="flex min-w-0 flex-1 flex-col gap-px">
              <span className="text-xs font-semibold">{t("findLink")}</span>
              <input
                name="q"
                type="search"
                autoComplete="off"
                placeholder={t("searchHint")}
                className="w-full min-w-0 bg-transparent text-[13px] outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden"
              />
            </label>
            <Button
              type="submit"
              size="icon"
              className="size-9 shrink-0 rounded-full"
              aria-label={t("search")}
            >
              <SearchIcon aria-hidden="true" />
            </Button>
          </form>
          <div className="flex flex-1 basis-0 items-center justify-end gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label={t("accountMenu")}
                className="flex shrink-0 items-center gap-2.5 rounded-full py-1.25 pr-1.25 pl-3.5 ring-1 ring-border transition-shadow outline-none hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/30 aria-expanded:shadow-md"
              >
                <MenuIcon aria-hidden="true" className="size-4" />
                <span
                  aria-hidden="true"
                  className="flex size-8 items-center justify-center rounded-full bg-muted-foreground text-[13px] font-semibold text-background"
                >
                  {initial}
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="flex flex-col gap-0.5">
                    <span className="truncate text-sm font-semibold text-foreground">
                      {session.user.name}
                    </span>
                    <span className="truncate text-xs font-normal">
                      {session.user.email}
                    </span>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem render={<Link href="/account" />}>
                  <CircleUserRoundIcon aria-hidden="true" />
                  {t("account")}
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/settings" />}>
                  <SettingsIcon aria-hidden="true" />
                  {t("settings")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>
                  <LogOutIcon aria-hidden="true" />
                  {t("signOut")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main
          id="main-content"
          tabIndex={-1}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 lg:p-12"
        >
          <PageTransition>{children}</PageTransition>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
