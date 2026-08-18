"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Spinner } from "@workspace/ui/components/spinner"
import { toast } from "@workspace/ui/components/toast"
import {
  CheckCircle2Icon,
  CopyIcon,
  KeyRoundIcon,
  LockKeyholeIcon,
  ShieldCheckIcon,
  Trash2Icon,
  TriangleAlertIcon,
} from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { formatDate } from "@/lib/format"
import { authClient, usePasskeyEnabled } from "@/lib/auth-client"

type TwoFactorEnrollment = { totpURI: string; backupCodes: string[] }

export default function AccountPage() {
  const { t, i18n } = useTranslation("settings")
  const { t: common } = useTranslation("common")
  const client = useQueryClient()
  const { data: session, isPending } = authClient.useSession()
  const [name, setName] = useState<string | null>(null)
  const [password, setPassword] = useState("")
  const [disablePassword, setDisablePassword] = useState("")
  const [code, setCode] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [enrollment, setEnrollment] = useState<TwoFactorEnrollment | null>(null)
  const passkeyStatus = usePasskeyEnabled()
  const passkeyEnabled = passkeyStatus.data?.passkeyEnabled === true

  const passkeys = useQuery({
    queryKey: ["passkeys"],
    enabled: passkeyEnabled && Boolean(session),
    queryFn: async () => {
      const response = await authClient.passkey.listUserPasskeys()
      if (response.error) throw new Error(response.error.message)
      return response.data ?? []
    },
  })

  const updateProfile = useMutation({
    mutationFn: async () => {
      const response = await authClient.updateUser({
        name: (name ?? session?.user.name ?? "").trim(),
      })
      if (response.error) throw new Error(response.error.message)
    },
    onSuccess: () => toast.add({ title: t("profileUpdated"), type: "success" }),
  })

  const changePassword = useMutation({
    mutationFn: async () => {
      const response = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      })
      if (response.error) throw new Error(response.error.message)
    },
    onSuccess: () => {
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      toast.add({ title: t("passwordUpdated"), type: "success" })
    },
  })

  const setupTwoFactor = useMutation({
    mutationFn: async () => {
      const response = await authClient.twoFactor.enable({ password })
      if (response.error) throw new Error(response.error.message)
      return response.data
    },
    onSuccess: (data) => {
      setEnrollment(data)
      setPassword("")
    },
  })

  const verifyTwoFactor = useMutation({
    mutationFn: async () => {
      const response = await authClient.twoFactor.verifyTotp({ code })
      if (response.error) throw new Error(response.error.message)
    },
    onSuccess: () => {
      setEnrollment(null)
      setCode("")
      toast.add({ title: t("twoFactorEnabled"), type: "success" })
    },
  })

  const disableTwoFactor = useMutation({
    mutationFn: async () => {
      const response = await authClient.twoFactor.disable({
        password: disablePassword,
      })
      if (response.error) throw new Error(response.error.message)
    },
    onSuccess: () => {
      setDisablePassword("")
      toast.add({ title: t("twoFactorDisabled"), type: "success" })
    },
  })

  const addPasskey = useMutation({
    mutationFn: async () => {
      const response = await authClient.passkey.addPasskey({
        name: t("passkey"),
      })
      if (response.error) throw new Error(response.error.message)
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["passkeys"] })
      toast.add({ title: t("passkeyAdded"), type: "success" })
    },
  })

  const removePasskey = useMutation({
    mutationFn: async (id: string) => {
      const response = await authClient.passkey.deletePasskey({ id })
      if (response.error) throw new Error(response.error.message)
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["passkeys"] })
      toast.add({ title: t("passkeyRemoved"), type: "success" })
    },
  })

  const mutationError =
    updateProfile.error ??
    changePassword.error ??
    setupTwoFactor.error ??
    verifyTwoFactor.error ??
    disableTwoFactor.error ??
    addPasskey.error ??
    removePasskey.error
  const setupKey = enrollment
    ? (new URL(enrollment.totpURI).searchParams.get("secret") ?? "")
    : ""

  if (isPending || !session) {
    return <Skeleton className="h-96 w-full" />
  }

  const profileName = name ?? session.user.name
  const passwordMismatch =
    confirmPassword.length > 0 && newPassword !== confirmPassword
  const canChangePassword =
    !changePassword.isPending &&
    currentPassword.length > 0 &&
    newPassword.length >= 8 &&
    newPassword === confirmPassword

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-[-0.03em]">
          {common("account")}
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          {t("accountDescription")}
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("profile")}</CardTitle>
            <CardDescription>{t("profileDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Input
              value={profileName}
              autoComplete="name"
              aria-label={t("profileName")}
              onChange={(event) => setName(event.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              {session.user.email}
            </p>
            <Button
              className="w-fit"
              disabled={
                updateProfile.isPending || profileName.trim().length < 2
              }
              onClick={() => updateProfile.mutate()}
            >
              {updateProfile.isPending ? (
                <Spinner data-icon="inline-start" />
              ) : null}
              {common("saveChanges")}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("password")}</CardTitle>
            <CardDescription>{t("passwordDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="flex flex-col gap-4"
              onSubmit={(event) => {
                event.preventDefault()
                if (canChangePassword) changePassword.mutate()
              }}
            >
              <div className="flex flex-col gap-2">
                <Label htmlFor="current-password">
                  {t("passwordRequired")}
                </Label>
                <Input
                  id="current-password"
                  type="password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="new-password">{t("newPassword")}</Label>
                <Input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="confirm-password">{t("confirmPassword")}</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  aria-invalid={passwordMismatch}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
                {passwordMismatch ? (
                  <p className="text-sm text-destructive" role="alert">
                    {t("passwordMismatch")}
                  </p>
                ) : null}
              </div>
              <Button
                type="submit"
                className="w-fit"
                disabled={!canChangePassword}
              >
                {changePassword.isPending ? (
                  <Spinner data-icon="inline-start" />
                ) : (
                  <LockKeyholeIcon data-icon="inline-start" />
                )}
                {t("changePassword")}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("twoFactorAuthentication")}</CardTitle>
            <CardDescription>{t("twoFactorDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {session.user.twoFactorEnabled ? (
              <>
                <div className="flex items-center gap-3 rounded-2xl bg-primary/10 p-3 text-sm text-primary">
                  <ShieldCheckIcon className="size-5" />
                  {t("twoFactorEnabled")}
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    value={disablePassword}
                    type="password"
                    autoComplete="current-password"
                    placeholder={t("passwordRequired")}
                    aria-label={t("passwordRequired")}
                    onChange={(event) => setDisablePassword(event.target.value)}
                  />
                  <Button
                    variant="outline"
                    disabled={disableTwoFactor.isPending || !disablePassword}
                    onClick={() => disableTwoFactor.mutate()}
                  >
                    {disableTwoFactor.isPending ? (
                      <Spinner data-icon="inline-start" />
                    ) : null}
                    {t("disableTwoFactor")}
                  </Button>
                </div>
              </>
            ) : enrollment ? (
              <div className="flex flex-col gap-4">
                <div className="rounded-2xl bg-muted p-4">
                  <p className="font-medium">{t("setupKey")}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t("setupKeyDescription")}
                  </p>
                  <code className="mt-3 block rounded-xl bg-background px-3 py-2 text-xs break-all">
                    {setupKey}
                  </code>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        void navigator.clipboard.writeText(setupKey)
                      }
                    >
                      <CopyIcon data-icon="inline-start" />
                      {common("copy")}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      render={<a href={enrollment.totpURI} />}
                    >
                      {t("openAuthenticator")}
                    </Button>
                  </div>
                </div>
                <div className="rounded-2xl border border-dashed p-4">
                  <p className="font-medium">{t("recoveryCodes")}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t("recoveryCodesDescription")}
                  </p>
                  <code className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-5">
                    {enrollment.backupCodes.map((backupCode) => (
                      <span key={backupCode}>{backupCode}</span>
                    ))}
                  </code>
                  <Button
                    className="mt-3"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      void navigator.clipboard.writeText(
                        enrollment.backupCodes.join("\n")
                      )
                    }
                  >
                    <CopyIcon data-icon="inline-start" />
                    {t("copyRecoveryCodes")}
                  </Button>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    value={code}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder={t("verificationCode")}
                    aria-label={t("verificationCode")}
                    onChange={(event) =>
                      setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                  />
                  <Button
                    disabled={verifyTwoFactor.isPending || code.length !== 6}
                    onClick={() => verifyTwoFactor.mutate()}
                  >
                    {verifyTwoFactor.isPending ? (
                      <Spinner data-icon="inline-start" />
                    ) : null}
                    {t("verifyAndEnable")}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <Input
                  value={password}
                  type="password"
                  autoComplete="current-password"
                  placeholder={t("passwordRequired")}
                  aria-label={t("passwordRequired")}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <Button
                  className="w-fit"
                  disabled={setupTwoFactor.isPending || !password}
                  onClick={() => setupTwoFactor.mutate()}
                >
                  {setupTwoFactor.isPending ? (
                    <Spinner data-icon="inline-start" />
                  ) : null}
                  {t("setUpTwoFactor")}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-start justify-between gap-4">
          <div className="space-y-1.5">
            <CardTitle>{t("passkeys")}</CardTitle>
            <CardDescription>{t("passkeysDescription")}</CardDescription>
          </div>
          {passkeyEnabled ? (
            <Button
              disabled={addPasskey.isPending}
              onClick={() => addPasskey.mutate()}
            >
              {addPasskey.isPending ? (
                <Spinner data-icon="inline-start" />
              ) : (
                <KeyRoundIcon data-icon="inline-start" />
              )}
              {t("addPasskey")}
            </Button>
          ) : null}
        </CardHeader>
        <CardContent>
          {!passkeyEnabled ? (
            <Alert>
              <TriangleAlertIcon />
              <AlertTitle>{t("passkeysUnavailable")}</AlertTitle>
              <AlertDescription>
                {t("passkeysUnavailableDescription")}
              </AlertDescription>
            </Alert>
          ) : passkeys.isPending ? (
            <Skeleton className="h-16 w-full" />
          ) : passkeys.isError ? (
            <Alert variant="destructive">
              <TriangleAlertIcon />
              <AlertTitle>{common("pageLoadError")}</AlertTitle>
              <AlertDescription>{passkeys.error.message}</AlertDescription>
            </Alert>
          ) : passkeys.data?.length ? (
            <div className="divide-y rounded-2xl border">
              {passkeys.data.map((passkey) => (
                <div key={passkey.id} className="flex items-center gap-3 p-4">
                  <KeyRoundIcon className="size-4 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {passkey.name || t("passkey")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(
                        passkey.createdAt.toISOString(),
                        i18n.resolvedLanguage
                      )}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={t("removePasskey")}
                    disabled={removePasskey.isPending}
                    onClick={() => removePasskey.mutate(passkey.id)}
                  >
                    <Trash2Icon />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-2xl bg-muted p-4 text-sm text-muted-foreground">
              <CheckCircle2Icon className="size-5" />
              {t("noPasskeys")}
            </div>
          )}
        </CardContent>
      </Card>

      {mutationError ? (
        <Alert variant="destructive">
          <TriangleAlertIcon />
          <AlertTitle>{common("pageLoadError")}</AlertTitle>
          <AlertDescription>{mutationError.message}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  )
}
