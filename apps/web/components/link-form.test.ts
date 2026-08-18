// @ts-expect-error Bun's test module is intentionally not part of the web bundle.
import { expect, test } from "bun:test"

import { createLinkSchema } from "./link-form"

const translate = (key: string) => key

test("requires a valid destination before opening link details", () => {
  const destination = createLinkSchema(translate).pick({ url: true })

  expect(destination.safeParse({ url: "https://example.com" }).success).toBe(
    true
  )
  expect(destination.safeParse({ url: "example.com" }).success).toBe(false)
})

test("treats blank click limit and password as untouched", () => {
  const schema = createLinkSchema(translate)
  const base = {
    url: "https://example.com",
    slug: "",
    title: "",
    expiresAt: "",
  }

  expect(schema.parse({ ...base, clickLimit: "", password: "" })).toMatchObject(
    {
      clickLimit: "",
      password: "",
    }
  )
  expect(
    schema.safeParse({ ...base, clickLimit: "0", password: "" }).success
  ).toBe(false)
  expect(
    schema.safeParse({ ...base, clickLimit: "12.5", password: "" }).success
  ).toBe(false)
  expect(
    schema.safeParse({ ...base, clickLimit: "", password: "abc" }).success
  ).toBe(false)
  expect(
    schema.safeParse({ ...base, clickLimit: "500", password: "segreto" })
      .success
  ).toBe(true)
})
