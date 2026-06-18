'use client'

import { useState, useEffect } from 'react'
import { CalendarIcon, X } from 'lucide-react'
import { Calendar } from './calendar'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { cn } from '@/lib/utils'

interface DateTimePickerProps {
  value: string // YYYY-MM-DDTHH:mm:ss (datetime-local format)
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

function parseDatePart(value: string): Date | undefined {
  if (!value || value.length < 10) return undefined
  const [year, month, day] = value.slice(0, 10).split('-').map(Number)
  const d = new Date(year, month - 1, day)
  return isNaN(d.getTime()) ? undefined : d
}

export function DateTimePicker({ value, onChange, placeholder = 'Pick date & time', className }: DateTimePickerProps) {
  const [open, setOpen] = useState(false)
  const [time, setTime] = useState(value.slice(11, 19) || '00:00:00')

  useEffect(() => {
    setTime(value ? (value.slice(11, 19) || '00:00:00') : '00:00:00')
  }, [value])

  const selectedDate = parseDatePart(value)

  const handleDaySelect = (day: Date | undefined) => {
    if (!day) return
    const p = (n: number) => String(n).padStart(2, '0')
    const datePart = `${day.getFullYear()}-${p(day.getMonth() + 1)}-${p(day.getDate())}`
    onChange(`${datePart}T${time}`)
  }

  const handleTimeChange = (newTime: string) => {
    setTime(newTime)
    if (value) onChange(`${value.slice(0, 10)}T${newTime}`)
  }

  const clear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('')
  }

  const displayValue = value ? value.replace('T', ' ').slice(0, 19) : null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          'h-6 inline-flex items-center gap-1 text-[11px] bg-transparent border border-border rounded-full px-2 text-foreground cursor-pointer hover:bg-muted transition-colors select-none',
          !displayValue && 'text-muted-foreground',
          className
        )}
      >
        <CalendarIcon size={11} className="shrink-0 text-muted-foreground" />
        <span>{displayValue ?? placeholder}</span>
        {displayValue && (
          <X size={11} className="shrink-0 text-muted-foreground hover:text-foreground ml-0.5" onClick={clear} />
        )}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleDaySelect}
        />
        <div className="border-t border-border px-3 py-2 flex items-center gap-2">
          <span className="text-xs text-muted-foreground shrink-0">Time</span>
          <input
            type="time"
            step="1"
            value={time}
            onChange={e => handleTimeChange(e.target.value)}
            className="flex-1 text-xs border border-border rounded-full px-2 py-0.5 bg-transparent focus:outline-none focus:border-ring text-foreground"
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}
