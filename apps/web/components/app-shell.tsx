"use client"

import { useQuery } from "@tanstack/react-query"
import { Button } from "@workspace/ui/components/button"
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
  BarChart3Icon,
  BookOpenIcon,
  ContactRoundIcon,
  KeyRoundIcon,
  Link2Icon,
  LogOutIcon,
  SettingsIcon,
  UsersRoundIcon,
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"
import { useTranslation } from "react-i18next"

import { Brand } from "@/components/brand"
import { LanguageSwitcher } from "@/components/language-switcher"
import { PageTransition } from "@/components/page-transition"
import { QuickLinkCapture } from "@/components/quick-link-capture"
import { ThemeToggle } from "@/components/theme-toggle"
import { api, type AppSettings } from "@/lib/api"
import { authClient } from "@/lib/auth-client"

const navigation = [
  { href: "/dashboard", label: "dashboard", icon: BarChart3Icon },
  { href: "/links", label: "links", icon: Link2Icon },
  { href: "/api-keys", label: "apiKeys", icon: KeyRoundIcon },
  { href: "/dashboard/docs", label: "documentation", icon: BookOpenIcon },
  { href: "/account", label: "account", icon: ContactRoundIcon },
]

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
    ? [
        ...navigation,
        { href: "/users", label: "users", icon: UsersRoundIcon },
        { href: "/settings", label: "settings", icon: SettingsIcon },
      ]
    : [
        ...navigation,
        { href: "/settings", label: "settings", icon: SettingsIcon },
      ]

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

  async function signOut() {
    await authClient.signOut()
    router.replace("/login")
    router.refresh()
  }

  return (
    <SidebarProvider className="h-svh overflow-hidden">
      <QuickLinkCapture />
      <Sidebar variant="inset" collapsible="icon">
        <SidebarHeader className="p-3 group-data-[collapsible=icon]:p-2">
          <div className="px-1 group-data-[collapsible=icon]:overflow-hidden">
            <Brand href="/dashboard" />
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>{t("workspace")}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navigationItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      render={<Link href={item.href} />}
                      tooltip={t(item.label)}
                      isActive={
                        pathname === item.href ||
                        (item.href === "/links" &&
                          pathname.startsWith("/links/"))
                      }
                    >
                      <item.icon />
                      <span>{t(item.label)}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <div className="min-w-0 px-2 py-1 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-sm font-medium">{session.user.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {session.user.email}
            </p>
          </div>
          <Button
            variant="ghost"
            className="justify-start group-data-[collapsible=icon]:px-2"
            onClick={signOut}
          >
            <LogOutIcon data-icon="inline-start" />
            <span className="group-data-[collapsible=icon]:hidden">
              {t("signOut")}
            </span>
          </Button>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset className="h-svh min-h-0 min-w-0 overflow-hidden md:h-auto">
        <header className="sticky top-0 isolate z-30 flex h-14 shrink-0 items-center gap-3 border-b bg-background/95 px-4 shadow-sm supports-backdrop-filter:bg-background/85 supports-backdrop-filter:backdrop-blur-xl sm:px-6">
          <SidebarTrigger />
          <span className="text-sm font-medium">Corto</span>
          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
        </header>
        <main
          id="main-content"
          tabIndex={-1}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 lg:p-8"
        >
          <PageTransition>{children}</PageTransition>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
