"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import { buttonVariants } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { toast } from "@workspace/ui/components/toast"
import { ArrowLeftIcon, TriangleAlertIcon } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"

import { LinkForm, type LinkInput } from "@/components/link-form"
import { api, type ShortLink } from "@/lib/api"

export default function NewLinkPage() {
  const { t } = useTranslation("links")
  const client = useQueryClient()
  const router = useRouter()
  const createLink = useMutation({
    mutationFn: (values: LinkInput) =>
      api<{ link: ShortLink }>("/v1/links", {
        method: "POST",
        body: JSON.stringify(values),
      }),
    onSuccess: async ({ link }) => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ["links"] }),
        client.invalidateQueries({ queryKey: ["analytics"] }),
      ])
      toast.add({
        title: t("linkCreated"),
        description: link.shortUrl,
        type: "success",
      })
    },
  })

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <header className="flex flex-col gap-4">
        <Link
          href="/links"
          className={`${buttonVariants({ variant: "ghost", size: "lg" })} w-fit`}
        >
          <ArrowLeftIcon data-icon="inline-start" />
          {t("links")}
        </Link>
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.03em]">
            {t("newShortLink")}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {t("newShortLinkDescription")}
          </p>
        </div>
      </header>

      <Card className="surface-shadow">
        <CardHeader className="border-b">
          <CardTitle>{t("newShortLink")}</CardTitle>
          <CardDescription>{t("newShortLinkDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="max-w-2xl">
          <LinkForm
            pending={createLink.isPending}
            onSubmit={async (values) => {
              const { link } = await createLink.mutateAsync(values)
              router.push(`/links/${link.id}`)
            }}
          />
          {createLink.isError ? (
            <Alert variant="destructive" className="mt-5">
              <TriangleAlertIcon />
              <AlertTitle>{t("linkCreateFailed")}</AlertTitle>
              <AlertDescription>{createLink.error.message}</AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
