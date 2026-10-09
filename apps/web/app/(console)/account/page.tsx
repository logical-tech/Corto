"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Spinner } from "@workspace/ui/components/spinner"
import { toast } from "@workspace/ui/components/toast"
import { cn } from "@workspace/ui/lib/utils"
import {
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
type OpenRow = "name" | "password" | "twoFactor" | null

const darkButton = "bg-foreground text-background hover:bg-foreground/85"

function Row({
  id,
  title,
  description,
  action,
  children,
}: {
  id?: string
  title: string
  description: React.ReactNode
  action?: React.ReactNode
  children?: React.ReactNode
}) {
  return (
    <div id={id} className="scroll-mt-24 border-b border-border-soft py-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <h3 className="font-medium">{title}</h3>
          <div className="text-sm text-muted-foreground">{description}</div>
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

function RowAction(props: React.ComponentProps<typeof Button>) {
  return (
    <Button
      variant="ghost"
      size="sm"
      {...props}
      className={cn("-mr-3 -mt-1.5 text-[15px] font-semibold", props.className)}
    />
  )
}

function FloatingField({
  label,
  ...props
}: { label: string } & React.ComponentProps<"input">) {
  return (
    <label className="flex flex-col gap-0.5 rounded-[10px] border border-border px-3.5 py-2.5 transition-[border-color,box-shadow] focus-within:border-foreground focus-within:ring-1 focus-within:ring-foreground has-aria-invalid:border-destructive">
      <span className="text-xs text-muted-foreground">{label}</span>
      <input
        {...props}
        className="w-full bg-transparent text-base outline-none placeholder:text-subtle-foreground"
      />
    </label>
  )
}

export default function AccountPage() {
  const { t, i18n } = useTranslation("settings")
  const { t: common } = useTranslation("common")
  const client = useQueryClient()
  const { data: session, isPending } = authClient.useSession()
  const [openRow, setOpenRow] = useState<OpenRow>(null)
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
    onSuccess: () => {
      setOpenRow(null)
      setName(null)
      toast.add({ title: t("profileUpdated"), type: "success" })
    },
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
      setOpenRow(null)
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
      setOpenRow(null)
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
      setOpenRow(null)
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
  const twoFactorOn = Boolean(session.user.twoFactorEnabled)
  const passkeyCount = passkeys.data?.length ?? 0
  const securityMax = passkeyEnabled ? 3 : 2
  const securityScore =
    1 + (twoFactorOn ? 1 : 0) + (passkeyEnabled && passkeyCount ? 1 : 0)
  const securityLevel =
    securityScore === securityMax
      ? t("securityHigh")
      : securityScore === 1
        ? t("securityLow")
        : t("securityMedium")
  const securityHint = !twoFactorOn
    ? passkeyEnabled && !passkeyCount
      ? t("securityHintBoth")
      : t("securityHintTwoFactor")
    : passkeyEnabled && !passkeyCount
      ? t("securityHintPasskey")
      : t("securityHintDone")

  function toggle(row: Exclude<OpenRow, null>) {
    setOpenRow((current) => (current === row ? null : row))
  }

  function openTwoFactor() {
    setOpenRow("twoFactor")
    document
      .getElementById("two-factor")
      ?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <header className="flex flex-col gap-1.5">
        <h1 className="text-[32px] leading-tight font-bold tracking-[-0.6px]">
          {t("loginSecurity")}
        </h1>
        <p className="max-w-2xl text-base text-muted-foreground">
          {t("accountDescription")}
        </p>
      </header>

      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_360px] xl:gap-18">
        <div className="flex min-w-0 flex-col">
          <div className="flex items-center gap-5 pb-8">
            <div
              aria-hidden
              className="flex size-16 shrink-0 items-center justify-center rounded-full bg-foreground text-2xl font-semibold text-background uppercase sm:size-22 sm:text-4xl"
            >
              {session.user.name.charAt(0)}
            </div>
            <div className="flex min-w-0 flex-col gap-1">
              <p className="truncate text-2xl font-bold">{session.user.name}</p>
              <div className="flex flex-wrap items-center gap-2">
                <span className="truncate text-[15px] text-muted-foreground">
                  {session.user.email}
                </span>
                {session.user.role === "admin" ? (
                  <span className="rounded-full bg-muted px-2 py-[3px] text-xs font-semibold">
                    {t("admin")}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <h2 className="text-[22px] font-semibold">{t("personalInfo")}</h2>
          <Row
            title={t("fullName")}
            description={session.user.name}
            action={
              <RowAction
                aria-expanded={openRow === "name"}
                onClick={() => {
                  setName(null)
                  toggle("name")
                }}
              >
                {openRow === "name" ? common("cancel") : t("edit")}
              </RowAction>
            }
          >
            {openRow === "name" ? (
              <form
                className="flex flex-col gap-3 pt-4 sm:flex-row"
                onSubmit={(event) => {
                  event.preventDefault()
                  if (profileName.trim().length >= 2) updateProfile.mutate()
                }}
              >
                <Input
                  value={profileName}
                  autoComplete="name"
                  aria-label={t("profileName")}
                  autoFocus
                  onChange={(event) => setName(event.target.value)}
                />
                <Button
                  type="submit"
                  className={cn("h-11 px-6", darkButton)}
                  disabled={
                    updateProfile.isPending || profileName.trim().length < 2
                  }
                >
                  {updateProfile.isPending ? (
                    <Spinner data-icon="inline-start" />
                  ) : null}
                  {common("saveChanges")}
                </Button>
              </form>
            ) : null}
          </Row>
          <Row
            title={t("emailAddress")}
            description={t("emailUsedToSignIn", { email: session.user.email })}
          />

          <h2 className="pt-10 text-[22px] font-semibold">{t("login")}</h2>
          <Row
            title={t("password")}
            description={t("passwordDescription")}
            action={
              <RowAction
                aria-expanded={openRow === "password"}
                onClick={() => toggle("password")}
              >
                {openRow === "password" ? common("cancel") : t("update")}
              </RowAction>
            }
          >
            {openRow === "password" ? (
              <form
                className="flex flex-col gap-3 pt-4 sm:pr-16"
                onSubmit={(event) => {
                  event.preventDefault()
                  if (canChangePassword) changePassword.mutate()
                }}
              >
                <FloatingField
                  label={t("passwordRequired")}
                  type="password"
                  autoComplete="current-password"
                  autoFocus
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                />
                <FloatingField
                  label={t("newPassword")}
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                />
                <FloatingField
                  label={t("confirmPassword")}
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
                <Button
                  type="submit"
                  size="lg"
                  className={cn("w-fit px-6", darkButton)}
                  disabled={!canChangePassword}
                >
                  {changePassword.isPending ? (
                    <Spinner data-icon="inline-start" />
                  ) : null}
                  {t("changePassword")}
                </Button>
              </form>
            ) : null}
          </Row>

          <Row
            id="two-factor"
            title={t("twoFactorAuthentication")}
            description={`${twoFactorOn ? t("statusOn") : t("statusOff")} · ${t("twoFactorDescription")}`}
            action={
              <RowAction
                aria-expanded={openRow === "twoFactor"}
                onClick={() => toggle("twoFactor")}
              >
                {openRow === "twoFactor"
                  ? common("cancel")
                  : twoFactorOn
                    ? t("disableTwoFactor")
                    : t("setUp")}
              </RowAction>
            }
          >
            {openRow === "twoFactor" ? (
              <div className="pt-4 sm:pr-16">
                {twoFactorOn ? (
                  <form
                    className="flex flex-col gap-3 sm:flex-row"
                    onSubmit={(event) => {
                      event.preventDefault()
                      if (disablePassword) disableTwoFactor.mutate()
                    }}
                  >
                    <Input
                      value={disablePassword}
                      type="password"
                      autoComplete="current-password"
                      autoFocus
                      placeholder={t("passwordRequired")}
                      aria-label={t("passwordRequired")}
                      onChange={(event) =>
                        setDisablePassword(event.target.value)
                      }
                    />
                    <Button
                      type="submit"
                      variant="outline"
                      className="h-11"
                      disabled={disableTwoFactor.isPending || !disablePassword}
                    >
                      {disableTwoFactor.isPending ? (
                        <Spinner data-icon="inline-start" />
                      ) : null}
                      {t("disableTwoFactor")}
                    </Button>
                  </form>
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
                    <form
                      className="flex flex-col gap-3 sm:flex-row"
                      onSubmit={(event) => {
                        event.preventDefault()
                        if (code.length === 6) verifyTwoFactor.mutate()
                      }}
                    >
                      <Input
                        value={code}
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        placeholder={t("verificationCode")}
                        aria-label={t("verificationCode")}
                        onChange={(event) =>
                          setCode(
                            event.target.value.replace(/\D/g, "").slice(0, 6)
                          )
                        }
                      />
                      <Button
                        type="submit"
                        className={cn("h-11 px-6", darkButton)}
                        disabled={verifyTwoFactor.isPending || code.length !== 6}
                      >
                        {verifyTwoFactor.isPending ? (
                          <Spinner data-icon="inline-start" />
                        ) : null}
                        {t("verifyAndEnable")}
                      </Button>
                    </form>
                  </div>
                ) : (
                  <form
                    className="flex flex-col gap-3 sm:flex-row"
                    onSubmit={(event) => {
                      event.preventDefault()
                      if (password) setupTwoFactor.mutate()
                    }}
                  >
                    <Input
                      value={password}
                      type="password"
                      autoComplete="current-password"
                      autoFocus
                      placeholder={t("passwordRequired")}
                      aria-label={t("passwordRequired")}
                      onChange={(event) => setPassword(event.target.value)}
                    />
                    <Button
                      type="submit"
                      className={cn("h-11 px-6", darkButton)}
                      disabled={setupTwoFactor.isPending || !password}
                    >
                      {setupTwoFactor.isPending ? (
                        <Spinner data-icon="inline-start" />
                      ) : null}
                      {t("setUpTwoFactor")}
                    </Button>
                  </form>
                )}
              </div>
            ) : null}
          </Row>

          <Row
            title={t("passkeys")}
            description={
              !passkeyEnabled
                ? t("passkeysUnavailableDescription")
                : passkeyCount
                  ? `${t("passkeyCount", { count: passkeyCount })} · ${t("passkeysDescription")}`
                  : `${t("noPasskeysYet")} · ${t("passkeysDescription")}`
            }
            action={
              passkeyEnabled ? (
                <RowAction
                  disabled={addPasskey.isPending}
                  onClick={() => addPasskey.mutate()}
                >
                  {addPasskey.isPending ? (
                    <Spinner data-icon="inline-start" />
                  ) : null}
                  {t("addPasskey")}
                </RowAction>
              ) : null
            }
          >
            {passkeyEnabled && passkeys.isPending ? (
              <Skeleton className="mt-4 h-14 w-full" />
            ) : null}
            {passkeyEnabled && passkeys.isError ? (
              <Alert variant="destructive" className="mt-4">
                <TriangleAlertIcon />
                <AlertTitle>{common("pageLoadError")}</AlertTitle>
                <AlertDescription>{passkeys.error.message}</AlertDescription>
              </Alert>
            ) : null}
            {passkeyEnabled && passkeys.data?.length ? (
              <ul className="mt-4 divide-y divide-border-soft rounded-xl border border-border">
                {passkeys.data.map((passkey) => (
                  <li
                    key={passkey.id}
                    className="flex items-center gap-3 py-2 pr-2 pl-4"
                  >
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
                      size="icon"
                      aria-label={t("removePasskey")}
                      disabled={removePasskey.isPending}
                      onClick={() => removePasskey.mutate(passkey.id)}
                    >
                      <Trash2Icon />
                    </Button>
                  </li>
                ))}
              </ul>
            ) : null}
          </Row>

          {mutationError ? (
            <Alert variant="destructive" className="mt-6">
              <TriangleAlertIcon />
              <AlertTitle>{common("pageLoadError")}</AlertTitle>
              <AlertDescription>{mutationError.message}</AlertDescription>
            </Alert>
          ) : null}
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-0">
          <section className="flex flex-col gap-4 rounded-2xl border border-border p-7">
            <ShieldCheckIcon
              aria-hidden
              className="size-10 text-primary"
              strokeWidth={1.5}
            />
            <h2 className="text-xl leading-[25px] font-semibold">
              {securityScore === securityMax
                ? t("securityDoneTitle")
                : t("securityTitle")}
            </h2>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {t("securityLevel")}
                </span>
                <span className="font-semibold">{securityLevel}</span>
              </div>
              <div
                role="meter"
                aria-label={t("securityLevel")}
                aria-valuemin={0}
                aria-valuemax={securityMax}
                aria-valuenow={securityScore}
                aria-valuetext={securityLevel}
                className="flex gap-1"
              >
                {Array.from({ length: securityMax }, (_, index) => (
                  <span
                    key={index}
                    className={cn(
                      "h-1.5 flex-1 rounded-[3px]",
                      index < securityScore ? "bg-primary" : "bg-border-soft"
                    )}
                  />
                ))}
              </div>
            </div>
            <p className="text-sm leading-5 text-muted-foreground">
              {securityHint}
            </p>
            {!twoFactorOn ? (
              <Button
                variant="outline"
                size="lg"
                className="w-full border-foreground font-semibold"
                onClick={openTwoFactor}
              >
                {t("setUpTwoFactor")}
              </Button>
            ) : passkeyEnabled && !passkeyCount ? (
              <Button
                variant="outline"
                size="lg"
                className="w-full border-foreground font-semibold"
                disabled={addPasskey.isPending}
                onClick={() => addPasskey.mutate()}
              >
                {t("addPasskey")}
              </Button>
            ) : null}
          </section>
          <section className="flex flex-col gap-2.5 rounded-2xl bg-muted p-7">
            <LockKeyholeIcon aria-hidden className="size-7" strokeWidth={1.5} />
            <h2 className="font-semibold">{t("changeableTitle")}</h2>
            <p className="text-sm leading-5 text-muted-foreground">
              {t("changeableDescription")}
            </p>
          </section>
        </aside>
      </div>
    </div>
  )
}
