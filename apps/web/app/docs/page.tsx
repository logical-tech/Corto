"use client"

import { DocumentationContent } from "@/app/(console)/dashboard/docs/page"
import { SiteHeader } from "@/components/landing-content"

export default function DocsPage() {
  return (
    <>
      <SiteHeader active="api" />
      <main id="main-content" tabIndex={-1}>
        <DocumentationContent />
      </main>
    </>
  )
}
