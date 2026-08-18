"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Spinner } from "@workspace/ui/components/spinner"
import { toast } from "@workspace/ui/components/toast"
import {
  ArrowRightIcon,
  CheckIcon,
  ClipboardCopyIcon,
  PencilLineIcon,
  ShuffleIcon,
  TriangleAlertIcon,
  XIcon,
} from "lucide-react"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import { api, type ShortLink } from "@/lib/api"
import styles from "./quick-link-capture.module.css"

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export const normalizePastedDestination = (value: string) => {
  const source = value.trim()
  if (
    !source ||
    /\s/.test(source) ||
    (/^[a-z][a-z0-9+.-]*:/i.test(source) && !/^https?:/i.test(source))
  ) {
    return null
  }

  try {
    const url = new URL(
      /^https?:\/\//i.test(source) ? source : `https://${source}`
    )
    if (
      !["http:", "https:"].includes(url.protocol) ||
      (!url.hostname.includes(".") && url.hostname !== "localhost")
    ) {
      return null
    }
    return url.toString()
  } catch {
    return null
  }
}

const isEditableTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false
  return (
    target.isContentEditable ||
    target.matches("input, textarea, select") ||
    Boolean(target.closest("[contenteditable='true']"))
  )
}

export function QuickLinkCapture() {
  const [destination, setDestination] = useState<string | null>(null)

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      if (isEditableTarget(event.target)) return
      const pastedDestination = normalizePastedDestination(
        event.clipboardData?.getData("text") ?? ""
      )
      if (!pastedDestination) return

      event.preventDefault()
      setDestination(pastedDestination)
    }

    window.addEventListener("paste", handlePaste, true)
    return () => window.removeEventListener("paste", handlePaste, true)
  }, [])

  return destination ? (
    <QuickLinkExperience
      key={destination}
      destination={destination}
      onClose={() => setDestination(null)}
    />
  ) : null
}

function QuickLinkExperience({
  destination,
  onClose,
}: {
  destination: string
  onClose: () => void
}) {
  const { t } = useTranslation("links")
  const client = useQueryClient()
  const [mode, setMode] = useState<"random" | "custom">("random")
  const [slug, setSlug] = useState("")
  const [slugError, setSlugError] = useState("")
  const [link, setLink] = useState<ShortLink | null>(null)
  const createLink = useMutation({
    mutationFn: (values: { slug?: string }) =>
      api<{ link: ShortLink }>("/v1/links", {
        method: "POST",
        body: JSON.stringify({ url: destination, ...values }),
      }),
    onSuccess: async ({ link }) => {
      setLink(link)
      await Promise.all([
        client.invalidateQueries({ queryKey: ["links"] }),
        client.invalidateQueries({ queryKey: ["analytics"] }),
      ])
    },
  })

  const create = () => {
    if (createLink.isPending) return
    const customSlug = slug.trim().toLowerCase()
    if (
      mode === "custom" &&
      (!slugPattern.test(customSlug) ||
        customSlug.length < 3 ||
        customSlug.length > 64)
    ) {
      setSlugError(t("invalidSlug"))
      return
    }
    setSlugError("")
    createLink.mutate({ slug: mode === "custom" ? customSlug : undefined })
  }

  const copy = async () => {
    if (!link) return
    await navigator.clipboard.writeText(link.shortUrl)
    toast.add({ title: t("quickLinkCopied"), type: "success" })
  }

  const visibleLink = link?.shortUrl ?? destination

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        overlayClassName={styles.overlay}
        className={`${styles.content} !inset-0 !top-0 !left-0 !grid !h-svh !w-screen !max-w-none !translate-x-0 !translate-y-0 !rounded-none !bg-transparent !p-0 !shadow-none !ring-0`}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>
            {link ? t("quickLinkGenerated") : t("quickLinkTitle")}
          </DialogTitle>
          <DialogDescription>
            {link ? t("quickLinkReady") : t("quickLinkDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className={styles.iridescence} aria-hidden="true">
          <div className={styles.iridescenceBeam} />
        </div>

        <DialogClose className={styles.close}>
          <XIcon className="size-4" />
          <span className="sr-only">{t("common:cancel")}</span>
        </DialogClose>

        <div className={styles.stage}>
          {link ? <CheckIcon className={styles.successIcon} /> : null}
          <code key={visibleLink} className={styles.destination}>
            {visibleLink}
          </code>

          {!link && mode === "custom" ? (
            <div className={styles.slugField}>
              <Label htmlFor="quick-link-slug" className="sr-only">
                {t("linkFormSlug")}
              </Label>
              <Input
                id="quick-link-slug"
                value={slug}
                placeholder="estate-2026"
                autoComplete="off"
                autoFocus
                spellCheck={false}
                aria-invalid={Boolean(slugError)}
                className={styles.slugInput}
                onChange={(event) => {
                  setSlug(event.target.value)
                  setSlugError("")
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault()
                    create()
                  }
                }}
              />
              {slugError ? (
                <p className={styles.slugError} role="alert">
                  {slugError}
                </p>
              ) : null}
            </div>
          ) : null}

          {createLink.isError ? (
            <Alert variant="destructive" className={styles.error}>
              <TriangleAlertIcon />
              <AlertTitle>{t("quickLinkCreateFailed")}</AlertTitle>
              <AlertDescription>{createLink.error.message}</AlertDescription>
            </Alert>
          ) : null}
        </div>

        <div className={styles.actions}>
          {link ? (
            <Button
              type="button"
              variant="outline"
              className={`${styles.action} ${styles.primaryAction}`}
              onClick={copy}
            >
              <ClipboardCopyIcon />
              {t("quickLinkCopy")}
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                className={`${styles.action} ${styles.modeAction}`}
                data-selected={mode === "random"}
                disabled={createLink.isPending}
                onClick={() => {
                  setMode("random")
                  setSlugError("")
                }}
              >
                <ShuffleIcon />
                {t("quickLinkRandom")}
              </Button>
              <Button
                type="button"
                variant="outline"
                className={`${styles.action} ${styles.modeAction}`}
                data-selected={mode === "custom"}
                disabled={createLink.isPending}
                onClick={() => setMode("custom")}
              >
                <PencilLineIcon />
                {t("quickLinkCustom")}
              </Button>
              <Button
                type="button"
                variant="outline"
                className={`${styles.action} ${styles.primaryAction}`}
                disabled={createLink.isPending}
                onClick={create}
              >
                {createLink.isPending ? <Spinner /> : <ArrowRightIcon />}
                {t("quickLinkGenerate")}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
