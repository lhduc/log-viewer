'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface CopyButtonProps {
  value: string
  className?: string
  label?: string
}

export function CopyButton({ value, className, label }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const onCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard API unavailable (e.g. non-secure context) — silently ignore
    }
  }

  return (
    <button
      onClick={onCopy}
      className={cn(
        'shrink-0 inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors',
        className
      )}
      aria-label="Copy"
    >
      {copied ? '✓ Copied' : (label ?? 'Copy')}
    </button>
  )
}
