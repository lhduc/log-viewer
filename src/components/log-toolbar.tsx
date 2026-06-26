'use client'

import { useEffect, useState } from 'react'
import { EyeOff, Search, SlidersHorizontal } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DateTimeRangePicker } from '@/components/ui/date-time-range-picker'
import { ExcludedUrlsDialog } from '@/components/settings-menu'
import { METHOD_STYLES, STATUS_STYLES } from '@/lib/request-utils'
import { useTimeMode } from '@/contexts/time-mode-context'
import { useSettings } from '@/contexts/settings-context'
import { cn } from '@/lib/utils'

const QUICK_RANGES = [
  { label: '5m', minutes: 5 },
  { label: '10m', minutes: 10 },
  { label: '30m', minutes: 30 },
  { label: '1h', minutes: 60 },
] as const

function toDatetimeLocal(d: Date, utc: boolean): string {
  if (utc) return d.toISOString().slice(0, 19)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const
const STATUS_BUCKETS = ['2xx', '3xx', '4xx', '5xx'] as const

const METHOD_BADGE: Record<string, { base: string; active: string }> = {
  GET:    { base: 'text-blue-600 border-blue-300 dark:text-blue-400 dark:border-blue-700',     active: 'bg-blue-100 dark:bg-blue-950' },
  POST:   { base: 'text-green-600 border-green-300 dark:text-green-400 dark:border-green-700', active: 'bg-green-100 dark:bg-green-950' },
  PUT:    { base: 'text-amber-600 border-amber-300 dark:text-amber-400 dark:border-amber-700', active: 'bg-amber-100 dark:bg-amber-950' },
  PATCH:  { base: 'text-orange-600 border-orange-300 dark:text-orange-400 dark:border-orange-700', active: 'bg-orange-100 dark:bg-orange-950' },
  DELETE: { base: 'text-red-600 border-red-300 dark:text-red-400 dark:border-red-700',         active: 'bg-red-100 dark:bg-red-950' },
}

const STATUS_BADGE: Record<string, { base: string; active: string }> = {
  '2xx': { base: 'text-green-600 border-green-300 dark:text-green-400 dark:border-green-700', active: 'bg-green-100 dark:bg-green-950' },
  '3xx': { base: 'text-blue-500 border-blue-300 dark:text-blue-400 dark:border-blue-700',    active: 'bg-blue-100 dark:bg-blue-950' },
  '4xx': { base: 'text-amber-600 border-amber-300 dark:text-amber-400 dark:border-amber-700', active: 'bg-amber-100 dark:bg-amber-950' },
  '5xx': { base: 'text-red-600 border-red-300 dark:text-red-400 dark:border-red-700',         active: 'bg-red-100 dark:bg-red-950' },
}

interface LogToolbarProps {
  methodFilter: Set<string>
  statusFilter: string
  search: string
  usernameFilter: string
  timeFrom: string
  timeTo: string
  filteredCount: number
  totalCount: number
  onToggleMethod: (method: string) => void
  onStatusFilter: (value: string) => void
  onSearch: (value: string) => void
  onUsernameFilter: (value: string) => void
  onTimeFrom: (value: string) => void
  onTimeTo: (value: string) => void
  onClear: () => void
  onClearFilters: () => void
}

export function LogToolbar({
  methodFilter,
  statusFilter,
  search,
  usernameFilter,
  timeFrom,
  timeTo,
  filteredCount,
  totalCount,
  onToggleMethod,
  onStatusFilter,
  onSearch,
  onUsernameFilter,
  onTimeFrom,
  onTimeTo,
  onClear,
  onClearFilters,
}: LogToolbarProps) {
  const [inputValue, setInputValue] = useState(search)
  const [usernameValue, setUsernameValue] = useState(usernameFilter)
  const [excludedOpen, setExcludedOpen] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const { mode } = useTimeMode()
  const { excludedUrls } = useSettings()

  useEffect(() => {
    const timer = setTimeout(() => onSearch(inputValue), 300)
    return () => clearTimeout(timer)
  }, [inputValue, onSearch])

  useEffect(() => {
    const timer = setTimeout(() => onUsernameFilter(usernameValue), 300)
    return () => clearTimeout(timer)
  }, [usernameValue, onUsernameFilter])

  // Sync external resets (e.g. Clear filters)
  useEffect(() => { setUsernameValue(usernameFilter) }, [usernameFilter])

  const hasFilters = methodFilter.size > 0 || statusFilter !== 'all' || !!search || !!usernameFilter || !!timeFrom || !!timeTo

  const filterChips = (
    <>
      {/* Method chips */}
      <div className="flex items-center gap-1">
        {METHODS.map(method => {
          const active = methodFilter.has(method)
          const s = METHOD_BADGE[method]
          return (
            <Badge
              key={method}
              variant="outline"
              onClick={() => onToggleMethod(method)}
              className={cn(
                'cursor-pointer text-[10px] px-1.5 py-0 h-5 select-none transition-colors',
                s.base,
                active ? s.active : 'opacity-50'
              )}
            >
              {method}
            </Badge>
          )
        })}
      </div>

      <div className="w-px h-4 bg-border shrink-0" />

      {/* Status chips */}
      <div className="flex items-center gap-1">
        {STATUS_BUCKETS.map(bucket => {
          const active = statusFilter === bucket
          const s = STATUS_BADGE[bucket]
          return (
            <Badge
              key={bucket}
              variant="outline"
              onClick={() => onStatusFilter(active ? 'all' : bucket)}
              className={cn(
                'cursor-pointer text-[10px] px-1.5 py-0 h-5 select-none transition-colors',
                s.base,
                active ? s.active : 'opacity-50'
              )}
            >
              {bucket}
            </Badge>
          )
        })}
      </div>

      <div className="w-px h-4 bg-border shrink-0" />

      {/* Username filter */}
      <Input
        value={usernameValue}
        onChange={e => setUsernameValue(e.target.value)}
        placeholder="Username"
        className="h-6 text-xs w-28"
      />

      <div className="w-px h-4 bg-border shrink-0" />

      {/* Quick ranges */}
      <div className="flex items-center gap-1">
        {QUICK_RANGES.map(range => (
          <Badge
            key={range.label}
            variant="outline"
            onClick={() => {
              const now = new Date()
              const from = new Date(now.getTime() - range.minutes * 60000)
              onTimeFrom(toDatetimeLocal(from, mode === 'utc'))
              onTimeTo('')
            }}
            className="cursor-pointer text-[10px] px-1.5 py-0 h-5 select-none text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            {range.label}
          </Badge>
        ))}
      </div>

      <div className="w-px h-4 bg-border shrink-0" />

      {/* Time range */}
      <DateTimeRangePicker
        valueFrom={timeFrom}
        valueTo={timeTo}
        onChangeFrom={onTimeFrom}
        onChangeTo={onTimeTo}
      />

      {/* Excluded URLs */}
      <button
        onClick={() => setExcludedOpen(true)}
        className={cn(
          'shrink-0 h-6 w-6 flex items-center justify-center rounded transition-colors',
          excludedUrls.length > 0
            ? 'text-primary hover:bg-muted'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
        )}
        aria-label="Excluded URLs"
        title={excludedUrls.length > 0 ? `${excludedUrls.length} excluded URL${excludedUrls.length > 1 ? 's' : ''}` : 'Excluded URLs'}
      >
        <EyeOff size={13} />
      </button>
    </>
  )

  return (
    <div className="border-b border-border bg-muted">
      {/* Primary row — always visible */}
      <div className="flex items-center gap-2 px-3 py-2">
        {/* Search input */}
        <div className="relative flex-1 sm:flex-none">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
          <Input
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            placeholder="Search URI, request ID, job ID…"
            className="h-6 text-xs w-full sm:w-56 pl-6"
          />
        </div>

        {/* Desktop: inline filters */}
        <div className="hidden sm:contents">
          {filterChips}
        </div>

        {/* Mobile: filter toggle */}
        <button
          onClick={() => setFiltersOpen(v => !v)}
          className={cn(
            'sm:hidden shrink-0 h-6 w-6 flex items-center justify-center rounded transition-colors relative',
            filtersOpen || hasFilters
              ? 'text-primary bg-primary/10'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          )}
          aria-label="Toggle filters"
        >
          <SlidersHorizontal size={13} />
          {hasFilters && !filtersOpen && (
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-primary" />
          )}
        </button>

        <div className="flex-1 hidden sm:block" />

        <span className="text-[10px] text-muted-foreground shrink-0">
          {filteredCount} / {totalCount}
        </span>

        {hasFilters && (
          <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={onClearFilters}>
            Clear filters
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-xs px-2 text-destructive hover:text-destructive"
          onClick={onClear}
        >
          Clear
        </Button>
      </div>

      {/* Mobile: expandable filter row */}
      {filtersOpen && (
        <div className="sm:hidden flex items-center gap-2 px-3 pb-2 flex-wrap">
          {filterChips}
        </div>
      )}

      <ExcludedUrlsDialog open={excludedOpen} onOpenChange={setExcludedOpen} />
    </div>
  )
}
