"use client"

import { useEffect } from "react"

export function DirectionContract({ value }: { value: string }) {
  useEffect(() => {
    const comment = document.createComment(value)
    document.body.insertBefore(comment, document.body.firstChild)
    return () => comment.remove()
  }, [value])

  return null
}
