import { createHmac } from "node:crypto"
import { isIPv6 } from "node:net"

// Crawlers, link unfurlers, mail scanners and HTTP libraries: real clicks, not visitors.
// No app names whose in-app browsers people browse with (Pinterest, Telegram, Outlook).
// The 0007 migration backfills existing clicks with the same pattern.
export const BOT_USER_AGENT =
  /(?<!cu)bot|crawl|spider|slurp|preview|scanner|headless|phantom|lighthouse|facebookexternalhit|whatsapp|embedly|vkshare|ms-office|microsoft office|curl|wget|python|httpx|aiohttp|go-http-client|okhttp|axios|node-fetch|undici|java\/|libwww|scrapy|postman|insomnia|monitor|uptime|pingdom|validator/i

type Headers = (name: string) => string | undefined

// IPv6 privacy extensions rotate the host half daily, so a device is its /64.
export const normalizeIp = (ip: string) => {
  const mapped = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i)
  if (mapped) return mapped[1]
  if (!isIPv6(ip)) return ip
  const [head, tail = ""] = ip.toLowerCase().split("::")
  const left = head ? head.split(":") : []
  const right = tail ? tail.split(":") : []
  const groups = ip.includes("::")
    ? [...left, ...Array(8 - left.length - right.length).fill("0"), ...right]
    : left
  return `${groups.slice(0, 4).map((g) => g.padStart(4, "0")).join(":")}::/64`
}

export const isBot = (header: Headers, method: string, secure: boolean) => {
  const userAgent = header("user-agent") ?? ""
  if (!userAgent || method === "HEAD" || BOT_USER_AGENT.test(userAgent)) {
    return true
  }
  // Chromium sends Fetch Metadata on every secure navigation since v76;
  // a "Chrome" without it is a script borrowing the user agent.
  return secure && /Chrome\//.test(userAgent) && !header("sec-fetch-mode")
}

// Keyed per link: the same browser on two links yields unrelated keys, so the
// value counts visitors without letting anyone follow a person across links.
export const visitorKey = (
  secret: string,
  linkId: string,
  ip: string,
  header: Headers
) =>
  createHmac("sha256", secret)
    .update(
      [
        "visitor",
        linkId,
        normalizeIp(ip),
        header("user-agent"),
        header("accept-language"),
        header("accept-encoding"),
        header("sec-ch-ua"),
        header("sec-ch-ua-mobile"),
        header("sec-ch-ua-platform"),
        header("dnt"),
        header("sec-gpc"),
      ]
        .map((part) => part ?? "")
        .join("\n")
    )
    .digest("hex")
