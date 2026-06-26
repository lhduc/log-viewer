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

  if (!now) return <div className="h-7 w-20 sm:w-52" />

  const utc = mode === 'utc'

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-7 px-2 text-xs font-mono text-primary-foreground opacity-80 hover:opacity-100 hover:text-primary-foreground hover:bg-primary-foreground/10"
      onClick={toggle}
      title="Toggle UTC / local time"
    >
      <span className="hidden sm:inline">{formatClock(now, utc)}</span>
      <span className="inline sm:hidden">{utc ? now.toISOString().slice(11, 19) : `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`}</span>
      {' '}{getOffset(now, utc)}
    </Button>
  )
}
