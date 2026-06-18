'use client'

import { Fragment } from 'react'

interface JsonViewerProps {
  data: unknown
}

// Token color classes — tuned for both light and dark themes
const COLORS = {
  key:     'text-sky-700 dark:text-sky-300',
  string:  'text-emerald-700 dark:text-emerald-300',
  number:  'text-amber-700 dark:text-amber-400',
  boolean: 'text-purple-700 dark:text-purple-400',
  null:    'text-rose-600 dark:text-rose-400',
  punct:   'text-muted-foreground',
}

// Regex matches JSON tokens: keys, strings, numbers, booleans, null
const TOKEN_RE = /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false)\b|\bnull\b|(-?\d+\.?\d*(?:[eE][+-]?\d+)?)/g

function highlightLine(line: string, lineIdx: number) {
  const parts: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null
  let key = 0

  TOKEN_RE.lastIndex = 0
  while ((match = TOKEN_RE.exec(line)) !== null) {
    // Punctuation / whitespace before the token
    if (match.index > lastIndex) {
      parts.push(
        <span key={`p${key++}`} className={COLORS.punct}>{line.slice(lastIndex, match.index)}</span>
      )
    }

    const [full, str, colon, bool, num] = match
    if (str !== undefined) {
      // A quoted string — it's a key if followed by a colon
      if (colon) {
        parts.push(<span key={`k${key++}`} className={COLORS.key}>{str}</span>)
        parts.push(<span key={`c${key++}`} className={COLORS.punct}>{colon}</span>)
      } else {
        parts.push(<span key={`s${key++}`} className={COLORS.string}>{str}</span>)
      }
    } else if (bool !== undefined) {
      parts.push(<span key={`b${key++}`} className={COLORS.boolean}>{bool}</span>)
    } else if (num !== undefined) {
      parts.push(<span key={`n${key++}`} className={COLORS.number}>{num}</span>)
    } else {
      parts.push(<span key={`x${key++}`} className={COLORS.null}>{full}</span>)
    }

    lastIndex = match.index + full.length
  }

  // Trailing punctuation
  if (lastIndex < line.length) {
    parts.push(<span key={`t${key++}`} className={COLORS.punct}>{line.slice(lastIndex)}</span>)
  }

  return <Fragment key={lineIdx}>{parts}{'\n'}</Fragment>
}

export function JsonViewer({ data }: JsonViewerProps) {
  const text = typeof data === 'string' ? data : JSON.stringify(data, null, 2)
  const lines = text.split('\n')

  return (
    <pre className="text-xs font-mono whitespace-pre-wrap break-all bg-muted rounded p-3 leading-relaxed overflow-x-auto">
      {lines.map((line, i) => highlightLine(line, i))}
    </pre>
  )
}
