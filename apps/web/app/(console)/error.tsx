"use client"

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { TriangleAlertIcon } from "lucide-react"
import { useTranslation } from "react-i18next"

export default function ConsoleError({
  reset,
}: {
  error: Error
  reset: () => void
}) {
  const { t } = useTranslation("common")
  return (
    <Alert variant="destructive">
      <TriangleAlertIcon />
      <AlertTitle>{t("pageLoadError")}</AlertTitle>
      <AlertDescription>{t("pageLoadErrorDescription")}</AlertDescription>
      <Button variant="outline" className="mt-3 w-fit" onClick={reset}>
        {t("retry")}
      </Button>
    </Alert>
  )
}
