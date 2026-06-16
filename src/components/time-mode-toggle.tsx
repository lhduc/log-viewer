'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useTimeMode } from '@/contexts/time-mode-context'

function useClock() {
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => {
    setNow(new Date())
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return now
}

function getOffset(d: Date, utc: boolean): string {
  if (utc) return '+00:00'
  const off = -d.getTimezoneOffset()
  const sign = off >= 0 ? '+' : '-'
  const abs = Math.abs(off)
  const h = String(Math.floor(abs / 60)).padStart(2, '0')
  const m = String(abs % 60).padStart(2, '0')
  return `${sign}${h}:${m}`
}

function formatClock(d: Date, utc: boolean): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  if (utc) return d.toISOString().slice(0, 19).replace('T', ' ')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

export function TimeModeToggle() {
  const { mode, toggle } = useTimeMode()
  const now = useClock()

  if (!now) return <div className="h-7 w-52" />

  const utc = mode === 'utc'

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-7 px-2 text-xs font-mono text-muted-foreground"
      onClick={toggle}
      title="Toggle UTC / local time"
    >
      {formatClock(now, utc)} {getOffset(now, utc)}
    </Button>
  )
}
