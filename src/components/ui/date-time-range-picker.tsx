'use client'

import { useState } from 'react'
import { CalendarIcon, X } from 'lucide-react'
import type { DateRange } from 'react-day-picker'
import { Calendar } from './calendar'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { cn } from '@/lib/utils'

interface DateTimeRangePickerProps {
  valueFrom: string // YYYY-MM-DDTHH:mm:ss
  valueTo: string
  onChangeFrom: (v: string) => void
  onChangeTo: (v: string) => void
  className?: string
}

function parseDatePart(value: string): Date | undefined {
  if (!value || value.length < 10) return undefined
  const [year, month, day] = value.slice(0, 10).split('-').map(Number)
  const d = new Date(year, month - 1, day)
  return isNaN(d.getTime()) ? undefined : d
}

function toDatetimeLocal(day: Date, time: string): string {
  const p = (n: number) => String(n).padStart(2, '0')
  const date = `${day.getFullYear()}-${p(day.getMonth() + 1)}-${p(day.getDate())}`
  return `${date}T${time}`
}

function formatDisplay(value: string): string {
  if (!value || value.length < 10) return ''
  // "2024-06-18T07:30:00" → "Jun 18, 07:30"
  const [datePart, timePart = ''] = value.split('T')
  const [year, month, day] = datePart.split('-').map(Number)
  const d = new Date(year, month - 1, day)
  const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const timeStr = timePart.slice(0, 5) // HH:mm
  return timeStr ? `${dateStr}, ${timeStr}` : dateStr
}

export function DateTimeRangePicker({
  valueFrom,
  valueTo,
  onChangeFrom,
  onChangeTo,
  className,
}: DateTimeRangePickerProps) {
  const [open, setOpen] = useState(false)
  const [fromTime, setFromTime] = useState(valueFrom.slice(11, 19) || '00:00:00')
  const [toTime, setToTime] = useState(valueTo.slice(11, 19) || '23:59:59')

  const range: DateRange = {
    from: parseDatePart(valueFrom),
    to: parseDatePart(valueTo),
  }

  const handleRangeSelect = (selected: DateRange | undefined) => {
    if (!selected) {
      onChangeFrom('')
      onChangeTo('')
      return
    }
    if (selected.from) onChangeFrom(toDatetimeLocal(selected.from, fromTime))
    else onChangeFrom('')
    if (selected.to) onChangeTo(toDatetimeLocal(selected.to, toTime))
    else onChangeTo('')
  }

  const handleFromTimeChange = (t: string) => {
    setFromTime(t)
    if (valueFrom) onChangeFrom(`${valueFrom.slice(0, 10)}T${t}`)
  }

  const handleToTimeChange = (t: string) => {
    setToTime(t)
    if (valueTo) onChangeTo(`${valueTo.slice(0, 10)}T${t}`)
  }

  const clear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChangeFrom('')
    onChangeTo('')
  }

  const fromDisplay = formatDisplay(valueFrom)
  const toDisplay = formatDisplay(valueTo)
  const hasValue = !!valueFrom || !!valueTo
  const label = hasValue
    ? fromDisplay && toDisplay
      ? `${fromDisplay} – ${toDisplay}`
      : fromDisplay || toDisplay
    : null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          'h-6 inline-flex items-center gap-1 text-[11px] bg-transparent border border-border rounded-full px-2 text-foreground cursor-pointer hover:bg-muted transition-colors select-none',
          !hasValue && 'text-muted-foreground',
          className
        )}
      >
        <CalendarIcon size={11} className="shrink-0 text-muted-foreground" />
        <span>{label ?? 'Date range'}</span>
        {hasValue && (
          <X size={11} className="shrink-0 text-muted-foreground hover:text-foreground ml-0.5" onClick={clear} />
        )}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={range}
          onSelect={handleRangeSelect}
          numberOfMonths={2}
        />
        <div className="border-t border-border px-3 py-2 grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground shrink-0">From</span>
            <input
              type="time"
              step="1"
              value={fromTime}
              onChange={e => handleFromTimeChange(e.target.value)}
              className="flex-1 text-xs border border-border rounded-full px-2 py-0.5 bg-transparent focus:outline-none focus:border-ring text-foreground"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground shrink-0">To</span>
            <input
              type="time"
              step="1"
              value={toTime}
              onChange={e => handleToTimeChange(e.target.value)}
              className="flex-1 text-xs border border-border rounded-full px-2 py-0.5 bg-transparent focus:outline-none focus:border-ring text-foreground"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
