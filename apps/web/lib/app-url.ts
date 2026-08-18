"use client"

import { useSyncExternalStore } from "react"

const buildTimeAppUrl = (
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
).replace(/\/$/, "")

// The origin cannot change without a full page load, so there is nothing to
// subscribe to.
const noopSubscribe = () => () => {}

/**
 * NEXT_PUBLIC_APP_URL is inlined when the bundle is built, which one-click
 * hosts cannot know yet: they only assign the public URL once the service
 * exists. The build-time value serves the server render, the browser corrects
 * it on hydration.
 */
export const useAppUrl = () =>
  useSyncExternalStore(
    noopSubscribe,
    () => window.location.origin.replace(/\/$/, ""),
    () => buildTimeAppUrl
  )
