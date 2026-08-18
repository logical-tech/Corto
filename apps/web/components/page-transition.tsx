"use client"

import { usePathname, useRouter } from "next/navigation"
import {
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react"

const exitDuration = 150

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [leaving, setLeaving] = useState(false)
  const isLeaving = useRef(false)

  useLayoutEffect(() => {
    isLeaving.current = false
    setLeaving(false)
  }, [pathname])

  function onClick(event: MouseEvent<HTMLDivElement>) {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      isLeaving.current ||
      !(event.target instanceof Element)
    )
      return

    const link = event.target.closest<HTMLAnchorElement>("a[href]")
    if (
      !link ||
      link.target ||
      link.hasAttribute("download") ||
      link.dataset.pageTransition === "off"
    )
      return

    const url = new URL(link.href)
    if (
      url.origin !== window.location.origin ||
      (url.pathname === window.location.pathname &&
        url.search === window.location.search)
    )
      return

    event.preventDefault()
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      router.push(`${url.pathname}${url.search}${url.hash}`)
      return
    }

    isLeaving.current = true
    setLeaving(true)
    window.setTimeout(
      () => router.push(`${url.pathname}${url.search}${url.hash}`),
      exitDuration
    )
  }

  return (
    <div
      key={pathname}
      className={leaving ? "page-transition is-leaving" : "page-transition"}
      onClickCapture={onClick}
    >
      {children}
    </div>
  )
}
