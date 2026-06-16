'use client'

import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { METHOD_STYLES, STATUS_STYLES } from '@/lib/request-utils'
import { cn } from '@/lib/utils'

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
  timeFrom: string
  timeTo: string
  filteredCount: number
  totalCount: number
  onToggleMethod: (method: string) => void
  onStatusFilter: (value: string) => void
  onSearch: (value: string) => void
  onTimeFrom: (value: string) => void
  onTimeTo: (value: string) => void
  onClear: () => void
  onClearFilters: () => void
}

export function LogToolbar({
  methodFilter,
  statusFilter,
  search,
  timeFrom,
  timeTo,
  filteredCount,
  totalCount,
  onToggleMethod,
  onStatusFilter,
  onSearch,
  onTimeFrom,
  onTimeTo,
  onClear,
  onClearFilters,
}: LogToolbarProps) {
  const [inputValue, setInputValue] = useState(search)

  useEffect(() => {
    const timer = setTimeout(() => onSearch(inputValue), 300)
    return () => clearTimeout(timer)
  }, [inputValue, onSearch])

  const hasFilters = methodFilter.size > 0 || statusFilter !== 'all' || !!search || !!timeFrom || !!timeTo

  return (
    <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-muted/40 flex-wrap">
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
                'cursor-pointer font-mono text-[10px] px-1.5 py-0 h-5 select-none transition-colors',
                s.base,
                active ? s.active : 'opacity-50'
              )}
            >
              {method}
            </Badge>
          )
        })}
      </div>

      <div className="w-px h-4 bg-border" />

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
                'cursor-pointer font-mono text-[10px] px-1.5 py-0 h-5 select-none transition-colors',
                s.base,
                active ? s.active : 'opacity-50'
              )}
            >
              {bucket}
            </Badge>
          )
        })}
      </div>

      <div className="w-px h-4 bg-border" />

      {/* URI search */}
      <Input
        value={inputValue}
        onChange={e => setInputValue(e.target.value)}
        placeholder="Search URI, request ID, job ID…"
        className="h-6 text-xs w-60"
      />

      <div className="w-px h-4 bg-border" />

      {/* Time range */}
      <div className="flex items-center gap-1">
        <input
          type="datetime-local"
          step="1"
          value={timeFrom}
          onChange={e => onTimeFrom(e.target.value)}
          className="h-6 text-[11px] font-mono bg-transparent border border-border rounded px-1.5 text-foreground cursor-pointer"
          title="From"
        />
        <span className="text-muted-foreground text-[10px]">–</span>
        <input
          type="datetime-local"
          step="1"
          value={timeTo}
          onChange={e => onTimeTo(e.target.value)}
          className="h-6 text-[11px] font-mono bg-transparent border border-border rounded px-1.5 text-foreground cursor-pointer"
          title="To"
        />
      </div>

      <div className="flex-1" />

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
  )
}
