"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import { toast } from "@workspace/ui/components/toast"
import { TriangleAlertIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"

import { LinkForm, type LinkInput } from "@/components/link-form"
import { api, type AdvertisingSettings, type ShortLink } from "@/lib/api"

export default function NewLinkPage() {
  const { t } = useTranslation("links")
  const client = useQueryClient()
  const router = useRouter()
  const advertising = useQuery({
    queryKey: ["advertising"],
    queryFn: ({ signal }) =>
      api<AdvertisingSettings>("/v1/advertising", { signal }),
    retry: false,
  })
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
    <div className="mx-auto flex w-full max-w-[640px] flex-col">
      <LinkForm
        pending={createLink.isPending}
        advertisingAvailable={Boolean(
          advertising.data?.enabled && advertising.data.banners.length
        )}
        onSubmit={async (values) => {
          const { link } = await createLink.mutateAsync(values)
          router.push(`/links/${link.id}`)
        }}
      >
        {createLink.isError ? (
          <Alert variant="destructive">
            <TriangleAlertIcon />
            <AlertTitle>{t("linkCreateFailed")}</AlertTitle>
            <AlertDescription>{createLink.error.message}</AlertDescription>
          </Alert>
        ) : null}
      </LinkForm>
    </div>
  )
}
