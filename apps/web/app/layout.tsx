import type { Metadata, Viewport } from "next"

import "@workspace/ui/globals.css"

import { Providers } from "@/app/providers"
import { DirectionContract } from "@/components/direction-contract"
import { SkipToContent } from "@/components/skip-to-content"

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
const themeScript = `(() => {
  try {
    const savedTheme = localStorage.getItem("corto.theme")
    const isDark = savedTheme
      ? savedTheme === "dark"
      : matchMedia("(prefers-color-scheme: dark)").matches
    document.documentElement.classList.toggle("dark", isDark)
  } catch {}
})()`
const directionContract = `
THESIS: Un URL lungo entra come una spedizione e ne esce come un'etichetta breve, leggibile e tracciabile; l'interfaccia rende concreto questo passaggio.
OWN-WORLD: Carta bianca, ink profondo, cobalto operativo e piccoli segnali corallo; linee di instradamento, nodi, tag e dati monospace raccontano il percorso.
STORY: Un visitatore capisce subito la promessa, genera il suo primo short link e scopre che dashboard e API parlano lo stesso linguaggio operativo.
FIRST VIEWPORT: Un headline netto, una descrizione breve, due CTA e una mappa di instradamento che mostra il passaggio da URL lungo a short link tracciato.
FORM: Modern routing desk, schema pagina B, direzione originale restaurata.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
`.trim()

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Corto — short links that stay yours",
    template: "%s · Corto",
  },
  description:
    "A modern, open-source URL shortener you can self-host. Link passwords, expiry dates, click limits, your own ads, and analytics — from the dashboard or the API.",
  applicationName: "Corto",
  keywords: [
    "URL shortener",
    "short link",
    "click tracking",
    "link analytics",
    "API",
    "self-hosted",
    "open source",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "Corto",
    title: "Corto — short links that stay yours",
    description:
      "Open-source, self-hosted URL shortener with link passwords, expiry, click limits, ads, and analytics.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Corto, from long URL to trackable short link",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Corto — short links that stay yours",
    description:
      "Open-source, self-hosted URL shortener with link passwords, expiry, click limits, ads, and analytics.",
    images: ["/opengraph-image"],
  },
}

export const viewport: Viewport = {
  themeColor: "#f7f5f0",
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        {/*
          THESIS: Un URL lungo entra come una spedizione e ne esce come un'etichetta breve, leggibile e tracciabile; l'interfaccia rende concreto questo passaggio.
          OWN-WORLD: Carta bianca, ink profondo, cobalto operativo e piccoli segnali corallo; linee di instradamento, nodi, tag e dati monospace raccontano il percorso.
          STORY: Un visitatore capisce subito la promessa, genera il suo primo short link e scopre che dashboard e API parlano lo stesso linguaggio operativo.
          FIRST VIEWPORT: Un headline netto, una descrizione breve, due CTA e una mappa di instradamento che mostra il passaggio da URL lungo a short link tracciato.
          FORM: Modern routing desk, schema pagina B, direzione originale restaurata.
          FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
        */}
        <DirectionContract value={directionContract} />
        <Providers>
          <SkipToContent />
          {children}
        </Providers>
      </body>
    </html>
  )
}
