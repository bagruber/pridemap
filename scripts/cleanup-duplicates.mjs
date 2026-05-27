import { readFileSync, writeFileSync } from 'fs'

const PARADES_PATH = './src/data/parades.json'
let parades = JSON.parse(readFileSync(PARADES_PATH, 'utf8'))

// --- Removals (city + date, optionally by name for same-date dupes) ---
const remove = [
  // Group A: exact duplicates, keep user-specified date
  { city: 'Frankfurt (Oder)', date: '2026-09-12' },
  { city: 'Minden',           date: '2026-08-15' },
  { city: 'Münster',          date: '2026-08-29' },
  { city: 'Ronnenberg',       date: '2026-07-11' },
  { city: 'Wrocław',          date: '2026-06-30' },
  // Group B: date-discrepancy, keep newer/later
  { city: 'Nancy',   date: '2026-06-07' },
  { city: 'Rennes',  date: '2026-06-07' },
  { city: 'Lille',   date: '2026-05-23' },
  { city: 'Rom',     date: '2026-06-13' },
  { city: 'Kiew',    date: '2026-06-21' },
  { city: 'Lyon',    date: '2026-06-13' },
  { city: 'Lyon',    date: '2026-07-11' },
  // Group C: genuinely different events — remove the weaker duplicate
  { city: 'Göteborg', date: '2026-08-08' },                                  // keep Jun 13 → update to Jun 14
  { city: 'Neapel',   date: '2026-06-20', name: 'Arrevutamm Pride' },       // keep Napoli Pride Jun 27
  { city: 'Taranto',  date: '2026-06-27', name: 'Human Pride – Taranto' },  // keep Taranto Pride Jun 6
  // Group D: same-date duplicate — keep Nicosia Pride
  { city: 'Nikosia',  date: '2026-06-06', name: 'Zypern Pride / CSD Zypern 2026' },
]

let removed = 0
for (const r of remove) {
  const before = parades.length
  parades = parades.filter(p => {
    if (p.city !== r.city || p.date !== r.date) return true
    if (r.name && p.name !== r.name) return true
    return false
  })
  const count = before - parades.length
  if (count === 0) console.warn(`⚠ No match to remove: ${r.city} ${r.date}${r.name ? ' "'+r.name+'"' : ''}`)
  removed += count
}

// --- Date fix: Göteborg main parade is Jun 14 ---
const gbg = parades.find(p => p.city === 'Göteborg' && p.date === '2026-06-13')
if (gbg) { gbg.date = '2026-06-14'; console.log('  Updated Göteborg: Jun 13 → Jun 14') }

// --- Rename: sub-city brackets → hyphens ---
const renames = {
  'Berlin (Marzahn)':      'Berlin-Marzahn',
  'Berlin (Reinickendorf)':'Berlin-Reinickendorf',
}
let renamed = 0
for (const p of parades) {
  if (renames[p.city]) { p.city = renames[p.city]; renamed++ }
}

parades.sort((a, b) => a.date.localeCompare(b.date))
writeFileSync(PARADES_PATH, JSON.stringify(parades, null, 2), 'utf8')
console.log(`✓ Removed ${removed} duplicate entries, renamed ${renamed} cities`)
