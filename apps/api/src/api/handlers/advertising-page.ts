import { lookup } from "node:dns/promises"
import { isIP } from "node:net"
import { randomBytes } from "node:crypto"
import {
  ADSTERRA_BANNER_PRESETS,
  type AdvertisingBanner,
} from "../../advertising"

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }
    return entities[character]
  })

const isPrivateAddress = (address: string) => {
  if (isIP(address) === 4) {
    const [first, second] = address.split(".").map(Number)
    return (
      first === 0 ||
      first === 10 ||
      first === 127 ||
      first >= 224 ||
      (first === 169 && second === 254) ||
      (first === 172 && second >= 16 && second <= 31) ||
      (first === 192 && second === 168)
    )
  }

  const normalized = address.toLowerCase()
  return (
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe80") ||
    normalized.includes("::ffff:127.") ||
    normalized.includes("::ffff:10.") ||
    normalized.includes("::ffff:192.168.")
  )
}

const isSafePublicUrl = async (url: URL) => {
  if (!["http:", "https:"].includes(url.protocol)) return false
  const hostname = url.hostname.toLowerCase()
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local")
  ) {
    return false
  }
  if (isIP(hostname)) return !isPrivateAddress(hostname)

  try {
    const addresses = await lookup(hostname, { all: true, verbatim: true })
    return (
      addresses.length > 0 &&
      addresses.every(({ address }) => !isPrivateAddress(address))
    )
  } catch {
    return false
  }
}

const fetchDestinationHtml = async (destination: string) => {
  let current = new URL(destination)

  for (let redirectCount = 0; redirectCount < 4; redirectCount++) {
    if (!(await isSafePublicUrl(current))) return null
    const response = await fetch(current, {
      headers: {
        accept: "text/html,application/xhtml+xml",
        "user-agent": "Shorts preview bot",
      },
      redirect: "manual",
      signal: AbortSignal.timeout(1500),
    })
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location")
      if (!location) return null
      current = new URL(location, current)
      continue
    }
    if (
      !response.ok ||
      !response.headers.get("content-type")?.includes("text/html")
    ) {
      return null
    }
    const contentLength = Number(response.headers.get("content-length") ?? 0)
    if (contentLength > 500_000) return null
    return { html: (await response.text()).slice(0, 500_000), url: current }
  }

  return null
}

export const getOpenGraphImage = async (destination: string) => {
  try {
    const page = await fetchDestinationHtml(destination)
    if (!page) return null
    const metaTags = page.html.match(/<meta\b[^>]*>/gi) ?? []

    for (const tag of metaTags) {
      const name = tag
        .match(/\b(?:property|name)\s*=\s*["']?([^\s"'>]+)/i)?.[1]
        ?.toLowerCase()
      const content = tag.match(/\bcontent\s*=\s*["']([^"']+)["']/i)?.[1]
      if (
        !content ||
        !["og:image", "og:image:secure_url", "twitter:image"].includes(
          name ?? ""
        )
      ) {
        continue
      }
      const image = new URL(content, page.url)
      if (
        ["http:", "https:"].includes(image.protocol) &&
        (await isSafePublicUrl(image))
      ) {
        return image.toString()
      }
    }
  } catch {
    // A missing preview must never hold up an advertising redirect.
  }

  return null
}

const adPositions = ["top", "left", "right", "bottom", "top", "bottom"] as const

const renderBanner = (banner: AdvertisingBanner, nonce: string) => {
  const preset = ADSTERRA_BANNER_PRESETS[banner.preset]
  const key = new URL(banner.scriptUrl).pathname.split("/")[1]
  const options = JSON.stringify({
    key,
    format: "iframe",
    height: preset.height,
    width: preset.width,
    params: {},
  }).replace(/</g, "\\u003c")

  return `<div class="ad-slot" data-width="${preset.width}" style="width:${preset.width}px;min-height:${preset.height}px">
    <span class="ad-label">Pubblicità</span>
    <script nonce="${nonce}">window.atOptions=${options};</script>
    <script nonce="${nonce}" src="${escapeHtml(banner.scriptUrl)}"></script>
  </div>`
}

export const renderAdvertisingPage = ({
  destination,
  automaticRedirect,
  delaySeconds,
  banners,
  openGraphImage,
}: {
  destination: string
  automaticRedirect: boolean
  delaySeconds: number
  banners: AdvertisingBanner[]
  openGraphImage: string | null
}) => {
  const nonce = randomBytes(16).toString("base64")
  const destinationUrl = new URL(destination)
  const areas = {
    top: [] as string[],
    left: [] as string[],
    right: [] as string[],
    bottom: [] as string[],
  }
  banners.forEach((banner, index) =>
    areas[adPositions[index] ?? "bottom"].push(renderBanner(banner, nonce))
  )
  const renderArea = (position: keyof typeof areas) =>
    areas[position].length
      ? `<aside class="ads ads--${position}">${areas[position].join("")}</aside>`
      : ""
  const payload = JSON.stringify({
    destination,
    delaySeconds,
    automaticRedirect,
  }).replace(/</g, "\\u003c")
  const preview = openGraphImage
    ? `<img class="preview__image" src="${escapeHtml(openGraphImage)}" alt="Anteprima di ${escapeHtml(destinationUrl.hostname)}" />`
    : `<div class="preview__fallback"><span class="signal"></span>${escapeHtml(destinationUrl.hostname)}</div>`

  return {
    csp: `default-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; script-src 'nonce-${nonce}' 'strict-dynamic' https://www.highperformanceformat.com; frame-src https:; img-src https: data:; connect-src https:; style-src 'unsafe-inline'`,
    html: `<!doctype html>
<html lang="it">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex,nofollow" />
    <meta name="color-scheme" content="light dark" />
    <title>Reindirizzamento in corso</title>
    <style>
      :root { color-scheme: light dark; font-family: Inter, ui-sans-serif, system-ui, sans-serif; background: #f6f7fb; color: #131827; }
      * { box-sizing: border-box; }
      body { margin: 0; min-width: 320px; background: radial-gradient(circle at 50% 18%, #edf3ff 0, #f6f7fb 42rem); }
      .gate { display: grid; grid-template-columns: minmax(10rem, 1fr) minmax(0, 36rem) minmax(10rem, 1fr); grid-template-areas: "top top top" "left panel right" "bottom bottom bottom"; min-height: 100svh; gap: clamp(1rem, 3vw, 3rem); padding: clamp(1rem, 4vw, 3.5rem); align-items: center; }
      .panel { grid-area: panel; overflow: hidden; border-radius: 24px; background: #fff; box-shadow: 0 24px 80px -42px rgba(15, 23, 42, .35); outline: 1px solid rgba(15, 23, 42, .08); }
      .panel__head { display: flex; align-items: center; gap: .65rem; border-bottom: 1px solid rgba(15, 23, 42, .08); padding: 1rem 1.25rem; color: #5b6476; font-size: .76rem; font-weight: 650; letter-spacing: .08em; text-transform: uppercase; }
      .signal { display: inline-block; width: .55rem; height: .55rem; border-radius: 999px; background: #fb6b5b; box-shadow: 0 0 0 .25rem rgba(251, 107, 91, .12); }
      .panel__body { padding: clamp(1.5rem, 5vw, 3rem); }
      h1 { max-width: 14ch; margin: 0; font-size: clamp(2.25rem, 7vw, 4.5rem); line-height: .97; letter-spacing: -.045em; text-wrap: balance; }
      .copy { margin: 1.25rem 0 0; color: #657087; font-size: 1rem; line-height: 1.65; text-wrap: pretty; }
      .counter { display: inline-flex; min-width: 2.1ch; justify-content: center; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-variant-numeric: tabular-nums; font-weight: 700; color: #356bf2; }
      .continue { display: inline-flex; min-height: 2.75rem; align-items: center; justify-content: center; margin-top: 1.5rem; padding: .65rem 1rem; border-radius: 12px; background: #356bf2; color: #fff; font-weight: 650; text-decoration: none; transition: background-color 150ms ease-out, scale 150ms ease-out; }
      .continue[hidden] { display: none; }
      .continue:hover { background: #2459dc; }
      .continue:active { scale: .96; }
      .continue:focus-visible { outline: 3px solid rgba(53, 107, 242, .38); outline-offset: 3px; }
      .preview { margin-top: 2rem; overflow: hidden; border-radius: 16px; background: #f1f4fa; outline: 1px solid rgba(15, 23, 42, .08); }
      .preview__image { display: block; aspect-ratio: 1.91 / 1; width: 100%; object-fit: cover; }
      .preview__fallback { display: flex; aspect-ratio: 1.91 / 1; align-items: center; justify-content: center; gap: .75rem; padding: 1.5rem; color: #657087; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: .875rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .destination { display: block; overflow: hidden; margin-top: 1rem; color: #657087; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: .78rem; text-overflow: ellipsis; white-space: nowrap; }
      .ads { display: flex; align-items: center; justify-content: center; gap: 1rem; min-width: 0; }
      .ads--top { grid-area: top; }
      .ads--left { grid-area: left; flex-direction: column; }
      .ads--right { grid-area: right; flex-direction: column; }
      .ads--bottom { grid-area: bottom; }
      .ad-slot { position: relative; flex: 0 0 auto; max-width: 100%; overflow: hidden; line-height: 0; }
      .ad-label { position: absolute; top: -1.1rem; left: 0; color: #7c8597; font-size: .62rem; font-weight: 650; letter-spacing: .07em; line-height: 1; text-transform: uppercase; }
      @media (prefers-color-scheme: dark) { :root { background: #121824; color: #f4f6fb; } body { background: radial-gradient(circle at 50% 18%, #1b2b4d 0, #121824 42rem); } .panel { background: #1b2332; outline-color: rgba(255, 255, 255, .1); box-shadow: 0 24px 80px -42px rgba(0, 0, 0, .85); } .panel__head { border-color: rgba(255, 255, 255, .1); color: #aeb8ca; } .copy, .destination, .preview__fallback { color: #b5bfce; } .continue { background: #5a88ff; } .continue:hover { background: #7aa0ff; } .preview { background: #131a27; outline-color: rgba(255, 255, 255, .1); } .ad-label { color: #9aa6ba; } }
      @media (max-width: 760px) { .gate { display: flex; min-height: 100svh; flex-direction: column; gap: 2rem; padding: 1rem; } .panel { width: 100%; } .ads { width: 100%; flex-wrap: wrap; } .ads--top { order: 1; } .panel { order: 2; } .ads--left, .ads--right, .ads--bottom { order: 3; } .ads--left, .ads--right { flex-direction: row; } .ad-slot[data-width="468"], .ad-slot[data-width="728"] { display: none; } }
    </style>
  </head>
  <body>
    <div class="gate">
      ${renderArea("top")}
      ${renderArea("left")}
      <main class="panel">
        <div class="panel__head"><span class="signal"></span> Shorts</div>
        <div class="panel__body">
          <h1>La tua destinazione è pronta.</h1>
          ${
            automaticRedirect
              ? `<p class="copy">Verrai reindirizzato qui tra <span class="counter" id="counter">${delaySeconds}</span> secondi.</p>`
              : `<p class="copy">Potrai continuare verso il sito tra <span class="counter" id="counter">${delaySeconds}</span> secondi.</p><a class="continue" hidden id="continue" href="${escapeHtml(destination)}">Continua verso il sito</a>`
          }
          <div class="preview">${preview}</div>
          <span class="destination">${escapeHtml(destinationUrl.hostname)}</span>
        </div>
      </main>
      ${renderArea("right")}
      ${renderArea("bottom")}
    </div>
    <noscript>${
      automaticRedirect
        ? "Abilita JavaScript per completare il reindirizzamento."
        : `<a class="continue" href="${escapeHtml(destination)}">Continua verso il sito</a>`
    }</noscript>
    <script nonce="${nonce}">
      const redirect = ${payload};
      const counter = document.getElementById("counter");
      const continueButton = document.getElementById("continue");
      let remaining = redirect.delaySeconds * 1000;
      let last = performance.now();
      const resetClock = () => { last = performance.now(); };
      const timer = window.setInterval(() => {
        const now = performance.now();
        if (document.visibilityState !== "visible" || !document.hasFocus()) { last = now; return; }
        remaining -= now - last;
        last = now;
        counter.textContent = String(Math.max(0, Math.ceil(remaining / 1000)));
        if (remaining <= 0) {
          window.clearInterval(timer);
          if (redirect.automaticRedirect) {
            window.location.replace(redirect.destination);
          } else {
            continueButton?.removeAttribute("hidden");
          }
        }
      }, 100);
      document.addEventListener("visibilitychange", resetClock);
      window.addEventListener("focus", resetClock);
      window.addEventListener("blur", resetClock);
      window.addEventListener("pagehide", () => window.clearInterval(timer));
    </script>
  </body>
</html>`,
  }
}
