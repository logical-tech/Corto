import type { LucideIcon } from "lucide-react"

export function MetricStrip({
  label,
  items,
}: {
  label: string
  items: Array<{
    label: string
    value: string
    detail?: string
    icon: LucideIcon
  }>
}) {
  return (
    <section
      aria-label={label}
      className="grid gap-4 sm:grid-cols-2 lg:auto-cols-fr lg:grid-flow-col"
    >
      {items.map(({ label: itemLabel, value, detail, icon: Icon }, index) => (
        <div
          key={itemLabel}
          className="metric-strip-item-enter flex min-w-0 flex-col rounded-2xl border border-border bg-card p-6 text-card-foreground"
          style={{ animationDelay: `${index * 40}ms` }}
        >
          <div className="flex items-center justify-between gap-4 text-sm font-medium text-muted-foreground">
            <span>{itemLabel}</span>
            <Icon aria-hidden="true" className="size-5 text-subtle-foreground" />
          </div>
          <p className="metric mt-3 truncate text-[32px] leading-tight font-bold tracking-[-0.025em]">
            {value}
          </p>
          {detail ? (
            <p className="mt-2 truncate text-[13px] font-medium text-muted-foreground">
              {detail}
            </p>
          ) : null}
        </div>
      ))}
    </section>
  )
}
