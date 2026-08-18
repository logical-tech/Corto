import Link from "next/link"

export function Brand({ href = "/" }: { href?: string }) {
  return (
    <Link
      href={href}
      translate="no"
      className="inline-flex min-h-10 items-center gap-2 rounded-xl font-semibold tracking-[-0.02em] focus-visible:ring-3 focus-visible:ring-ring/30"
    >
      <span
        aria-hidden="true"
        className="relative flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm"
      >
        <span className="absolute left-1.5 size-1.5 rounded-full bg-current" />
        <span className="absolute right-1.5 size-1.5 rounded-full bg-current" />
        <span className="h-px w-3 bg-current" />
      </span>
      Shorts
    </Link>
  )
}
