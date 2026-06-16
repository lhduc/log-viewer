'use client'

import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const LEVELS = ['error', 'warn', 'info', 'debug', 'trace'] as const

const LEVEL_BADGE_STYLES: Record<string, { base: string; active: string }> = {
  error: { base: 'border-red-300 text-red-600 dark:border-red-800 dark:text-red-400',       active: 'bg-red-100 dark:bg-red-950' },
  warn:  { base: 'border-amber-300 text-amber-600 dark:border-yellow-800 dark:text-yellow-400', active: 'bg-amber-100 dark:bg-yellow-950' },
  info:  { base: 'border-blue-300 text-blue-600 dark:border-blue-800 dark:text-blue-400',    active: 'bg-blue-100 dark:bg-blue-950' },
  debug: { base: 'border-gray-300 text-gray-500 dark:border-gray-700 dark:text-gray-400',   active: 'bg-gray-100 dark:bg-gray-800' },
  trace: { base: 'border-gray-200 text-gray-400 dark:border-gray-800 dark:text-gray-600',   active: 'bg-gray-50 dark:bg-gray-900' },
}

interface LogToolbarProps {
  levelFilter: Set<string>
  search: string
  streamFilter: 'both' | 'stdout' | 'stderr'
  rawMode: boolean
  filteredCount: number
  totalCount: number
  onToggleLevel: (level: string) => void
  onSearch: (value: string) => void
  onStreamFilter: (value: 'both' | 'stdout' | 'stderr') => void
  onToggleRaw: () => void
  onClear: () => void
  onClearFilters: () => void
}

export function LogToolbar({
  levelFilter,
  search,
  streamFilter,
  rawMode,
  filteredCount,
  totalCount,
  onToggleLevel,
  onSearch,
  onStreamFilter,
  onToggleRaw,
  onClear,
  onClearFilters,
}: LogToolbarProps) {
  const [inputValue, setInputValue] = useState(search)

  useEffect(() => {
    const timer = setTimeout(() => onSearch(inputValue), 300)
    return () => clearTimeout(timer)
  }, [inputValue, onSearch])

  const hasFilters = levelFilter.size > 0 || search || streamFilter !== 'both'

  return (
    <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-muted/40 flex-wrap">
      {/* Level filter chips */}
      <div className="flex items-center gap-1">
        {LEVELS.map(level => {
          const active = levelFilter.has(level)
          const styles = LEVEL_BADGE_STYLES[level]
          return (
            <Badge
              key={level}
              variant="outline"
              onClick={() => onToggleLevel(level)}
              className={cn(
                'cursor-pointer uppercase text-[10px] px-1.5 py-0 h-5 select-none transition-colors',
                styles.base,
                active ? styles.active : 'opacity-50'
              )}
            >
              {level}
            </Badge>
          )
        })}
      </div>

      <div className="w-px h-4 bg-border" />

      {/* Stream filter */}
      <div className="flex items-center gap-1">
        {(['both', 'stdout', 'stderr'] as const).map(s => (
          <button
            key={s}
            onClick={() => onStreamFilter(s)}
            className={cn(
              'text-[10px] px-2 py-0.5 rounded border transition-colors',
              streamFilter === s
                ? 'border-border text-foreground bg-accent'
                : 'border-border text-muted-foreground hover:text-foreground'
            )}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="w-px h-4 bg-border" />

      {/* Search */}
      <Input
        value={inputValue}
        onChange={e => setInputValue(e.target.value)}
        placeholder="Search logs…"
        className="h-6 text-xs w-40"
      />

      <div className="flex-1" />

      {/* Counts */}
      <span className="text-[10px] text-muted-foreground shrink-0">
        {filteredCount} / {totalCount}
      </span>

      {/* Actions */}
      {hasFilters && (
        <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={onClearFilters}>
          Clear filters
        </Button>
      )}
      <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={onToggleRaw}>
        {rawMode ? 'Structured' : 'Raw'}
      </Button>
      <Button variant="ghost" size="sm" className="h-6 text-xs px-2 text-destructive hover:text-destructive" onClick={onClear}>
        Clear
      </Button>
    </div>
  )
}
