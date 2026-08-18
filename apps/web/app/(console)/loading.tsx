import { Skeleton } from "@workspace/ui/components/skeleton"

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-14 w-64" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-80 w-full" />
    </div>
  )
}
