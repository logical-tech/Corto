import Link from "next/link"

export function Brand({ href = "/" }: { href?: string }) {
  return (
    <Link
      href={href}
      translate="no"
      className="inline-flex min-h-10 items-center gap-2.5 rounded-xl text-2xl font-extrabold tracking-[-0.8px] text-primary focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none"
    >
      <span
        aria-hidden="true"
        className="flex size-8.5 shrink-0 items-center justify-center gap-0.75 rounded-[10px] bg-primary text-primary-foreground"
      >
        <span className="size-2.25 rounded-full bg-current" />
        <span className="h-0.75 w-1 bg-current" />
        <span className="size-2.25 rounded-full bg-current" />
      </span>
      corto
    </Link>
  )
}
