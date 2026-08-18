import { ImageResponse } from "next/og"

export const alt = "Corto, from long URL to trackable short link"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        alignItems: "center",
        background: "#faf9f5",
        color: "#151c2b",
        display: "flex",
        height: "100%",
        justifyContent: "space-between",
        padding: "72px",
        width: "100%",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 30,
          width: 650,
        }}
      >
        <div
          style={{
            alignItems: "center",
            display: "flex",
            fontSize: 30,
            fontWeight: 700,
            gap: 14,
          }}
        >
          <div
            style={{
              background: "#315ee8",
              borderRadius: 12,
              height: 42,
              width: 42,
            }}
          />
          Corto
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 72,
            fontWeight: 700,
            letterSpacing: "-4px",
            lineHeight: 1.02,
          }}
        >
          Manda ogni link sulla strada giusta.
        </div>
        <div style={{ color: "#5d6678", display: "flex", fontSize: 28 }}>
          Short link, click tracking e API in un solo servizio self-hosted.
        </div>
      </div>
      <div style={{ alignItems: "center", display: "flex", width: 350 }}>
        <div
          style={{
            background: "#315ee8",
            borderRadius: 14,
            height: 18,
            width: 18,
          }}
        />
        <div style={{ background: "#315ee8", height: 4, width: 235 }} />
        <div
          style={{
            background: "#f36b52",
            borderRadius: 14,
            height: 24,
            width: 24,
          }}
        />
      </div>
    </div>,
    size
  )
}
