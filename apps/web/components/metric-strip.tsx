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
      className="surface-shadow relative isolate grid overflow-hidden rounded-2xl bg-primary text-primary-foreground md:grid-cols-3"
    >
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 hidden h-full w-full opacity-20 md:block"
        viewBox="0 0 960 180"
        preserveAspectRatio="none"
        fill="none"
      >
        <path
          d="M0 42H290C360 42 360 138 430 138H668C738 138 738 72 808 72H960"
          stroke="currentColor"
          strokeWidth="3"
        />
        <circle cx="0" cy="42" r="7" fill="var(--signal)" />
        <circle cx="960" cy="72" r="7" fill="currentColor" />
      </svg>
      {items.map(({ label: itemLabel, value, detail, icon: Icon }, index) => (
        <div
          key={itemLabel}
          className="metric-strip-item-enter relative grid min-h-[5.5rem] grid-cols-[2.75rem_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 border-primary-foreground/15 p-5 not-last:border-b md:flex md:min-h-36 md:flex-col md:items-stretch md:justify-between md:gap-6 md:p-6 md:not-last:border-r md:not-last:border-b-0"
          style={{ animationDelay: `${index * 40}ms` }}
        >
          <div className="row-span-2 flex size-11 items-center justify-center rounded-xl bg-primary-foreground/10 md:hidden">
            <Icon aria-hidden="true" className="size-5" />
          </div>
          <div className="min-w-0 text-sm text-primary-foreground/75 md:flex md:items-center md:justify-between md:gap-4">
            <span>{itemLabel}</span>
            <Icon aria-hidden="true" className="hidden md:block" />
          </div>
          <div className="contents md:block">
            <p className="metric col-start-3 row-span-2 row-start-1 justify-self-end text-3xl font-semibold tracking-[-0.04em] md:mt-6 md:text-4xl">
              {value}
            </p>
            {detail ? (
              <p className="col-start-2 row-start-2 text-xs text-primary-foreground/65 md:mt-2">
                {detail}
              </p>
            ) : null}
          </div>
        </div>
      ))}
    </section>
  )
}
