'use client'

import { useEffect, useState } from 'react'
import type { Virtualizer } from '@tanstack/react-virtual'

export function useAutoScroll(
  virtualizer: Virtualizer<HTMLDivElement, Element>,
  count: number
) {
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (!paused && count > 0) {
      virtualizer.scrollToIndex(count - 1, { align: 'end' })
    }
  }, [count, paused, virtualizer])

  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    setPaused(distFromBottom > 80)
  }

  return { paused, resume: () => setPaused(false), onScroll }
}
