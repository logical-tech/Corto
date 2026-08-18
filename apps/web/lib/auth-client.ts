"use client"

import { apiKeyClient } from "@better-auth/api-key/client"
import { passkeyClient } from "@better-auth/passkey/client"
import { useQuery } from "@tanstack/react-query"
import { createAuthClient } from "better-auth/react"
import { adminClient, twoFactorClient } from "better-auth/client/plugins"

import { api, type AuthStatus } from "@/lib/api"

export const usePasskeyEnabled = () =>
  useQuery({
    queryKey: ["auth-status"],
    queryFn: ({ signal }) => api<AuthStatus>("/v1/auth/status", { signal }),
    staleTime: Infinity,
  })

export const authClient = createAuthClient({
  basePath: "/api/auth",
  fetchOptions: { credentials: "include" },
  plugins: [
    apiKeyClient(),
    adminClient(),
    passkeyClient(),
    twoFactorClient({ twoFactorPage: "/two-factor" }),
  ],
})
