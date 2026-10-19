import { readFileSync } from 'node:fs'

function parseCSVLine(line) {
  const fields = []
  let cur = '', inQ = false
  for (const ch of line) {
    if (ch === '"') inQ = !inQ
    else if (ch === ',' && !inQ) { fields.push(cur); cur = '' }
    else cur += ch
  }
  fields.push(cur)
  return fields
}

// ILGA-Europe's Rainbow Map: country code, name, score as a percentage with a
// decimal comma. The index belongs to the country, not to a Pride, so it is
// attached at build time instead of being written into 639 records.
export function rainbowIndex(csvPath = 'data/rainbow-map-2026.csv') {
  const lines = readFileSync(csvPath, 'utf8').split('\n').filter(l => l.trim())
  const out = {}
  for (const line of lines.slice(3)) {
    const cols = parseCSVLine(line)
    const code = cols[0]?.trim()
    const score = parseFloat(cols[2]?.trim().replace(',', '.'))
    if (code && !Number.isNaN(score)) out[code] = Math.round(score)
  }
  return out
}
