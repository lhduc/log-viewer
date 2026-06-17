import React from 'react'

const KEYWORDS = new Set([
  'SELECT','FROM','WHERE','JOIN','LEFT','RIGHT','INNER','OUTER','CROSS','FULL',
  'ON','GROUP','BY','ORDER','HAVING','INSERT','INTO','VALUES','UPDATE','SET',
  'DELETE','CREATE','TABLE','INDEX','DROP','ALTER','LIMIT','OFFSET','DISTINCT',
  'AS','AND','OR','NOT','IN','BETWEEN','LIKE','ILIKE','IS','NULL','UNION','ALL',
  'EXCEPT','INTERSECT','COUNT','SUM','AVG','MAX','MIN','COALESCE','CASE','WHEN',
  'THEN','ELSE','END','WITH','EXISTS','ASC','DESC','PRIMARY','KEY','FOREIGN',
  'REFERENCES','DEFAULT','CONSTRAINT','UNIQUE','CHECK','IF','RETURNING',
])

type Token = { type: 'keyword' | 'string' | 'number' | 'comment' | 'plain'; text: string }

function tokenizeLine(line: string): Token[] {
  const tokens: Token[] = []
  let i = 0

  while (i < line.length) {
    // Line comment
    if (line[i] === '-' && line[i + 1] === '-') {
      tokens.push({ type: 'comment', text: line.slice(i) })
      break
    }
    // Block comment start (inline, won't span lines after split)
    if (line[i] === '/' && line[i + 1] === '*') {
      const end = line.indexOf('*/', i + 2)
      const text = end === -1 ? line.slice(i) : line.slice(i, end + 2)
      tokens.push({ type: 'comment', text })
      i += text.length
      continue
    }
    // String literal
    if (line[i] === "'" || line[i] === '"') {
      const q = line[i]
      let j = i + 1
      while (j < line.length) {
        if (line[j] === '\\') { j += 2; continue }
        if (line[j] === q) { j++; break }
        j++
      }
      tokens.push({ type: 'string', text: line.slice(i, j) })
      i = j
      continue
    }
    // Number
    if (/[0-9]/.test(line[i]) || (line[i] === '.' && /[0-9]/.test(line[i + 1] ?? ''))) {
      let j = i
      while (j < line.length && /[0-9.]/.test(line[j])) j++
      tokens.push({ type: 'number', text: line.slice(i, j) })
      i = j
      continue
    }
    // Identifier or keyword (including backtick-quoted)
    if (/[a-zA-Z_`]/.test(line[i])) {
      let j = i
      while (j < line.length && /[a-zA-Z0-9_`.]/.test(line[j])) j++
      const text = line.slice(i, j)
      const upper = text.replace(/`/g, '').toUpperCase()
      tokens.push({ type: KEYWORDS.has(upper) ? 'keyword' : 'plain', text })
      i = j
      continue
    }
    tokens.push({ type: 'plain', text: line[i] })
    i++
  }

  return tokens
}

const TOKEN_CLASS: Record<Token['type'], string> = {
  keyword: 'text-blue-600 dark:text-blue-400 font-semibold',
  string:  'text-green-600 dark:text-green-400',
  number:  'text-orange-500 dark:text-orange-400',
  comment: 'text-gray-400 dark:text-gray-500 italic',
  plain:   'text-foreground',
}

export function SqlHighlight({ sql }: { sql: string }) {
  const lines = sql.split('\n')
  return (
    <code className="font-mono text-xs">
      {lines.map((line, li) => (
        <div key={li}>
          {tokenizeLine(line).map((t, ti) => (
            <span key={ti} className={TOKEN_CLASS[t.type]}>{t.text}</span>
          ))}
          {/* preserve empty lines */}
          {line === '' && <span> </span>}
        </div>
      ))}
    </code>
  )
}
