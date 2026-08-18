// @ts-expect-error Bun's test types are intentionally not part of the web app's TypeScript build.
import { expect, test } from "bun:test"

import { normalizePastedDestination } from "./quick-link-capture"

test("normalizes valid pasted web destinations", () => {
  expect(normalizePastedDestination("mail.google.com")).toBe(
    "https://mail.google.com/"
  )
  expect(normalizePastedDestination("https://example.com/docs?q=1")).toBe(
    "https://example.com/docs?q=1"
  )
})

test("rejects non-web, incomplete, and malformed pasted destinations", () => {
  expect(normalizePastedDestination("mailto:hello@example.com")).toBeNull()
  expect(normalizePastedDestination("localhost:3000")).toBeNull()
  expect(normalizePastedDestination("hello world")).toBeNull()
})
