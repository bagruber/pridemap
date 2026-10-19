// data/prides/<cc>.json → src/data/prides.json
//
// The source of truth is one file per country, with everything a research
// session needs: sources, check dates, notes. The app needs none of that, so
// the build strips it down and keeps the bundle to what is actually drawn.
//
//   node scripts/data/build.mjs [--strict] [--warnings]
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { validate } from './validate.mjs'
import { rainbowIndex } from './rainbowIndex.mjs'

const strict = process.argv.includes('--strict')
// Every `pnpm run dev` runs this. 380 known gaps scrolling past would train
// everyone to ignore them, so they are counted by kind and only listed on ask.
const listWarnings = process.argv.includes('--warnings')

const prides = readdirSync('data/prides')
  .filter(f => f.endsWith('.json'))
  .flatMap(f => JSON.parse(readFileSync(`data/prides/${f}`, 'utf8')))

const { errors, warnings } = validate(prides)
if (listWarnings) for (const w of warnings) console.warn(`  ! ${w}`)
for (const e of errors) console.error(`  ✗ ${e}`)
if (errors.length) {
  console.error(`\n${errors.length} Fehler — src/data/prides.json nicht geschrieben.`)
  process.exit(1)
}
if (strict && warnings.length) {
  console.error(`\n${warnings.length} Warnung(en), --strict.`)
  process.exit(1)
}

const index = rainbowIndex()

// Of an edition's sources the runtime needs only where the date came from and
// when it was last checked — one line in the detail panel.
const trim = e => {
  const newest = [...(e.sources ?? [])].sort((a, b) => (b.checked ?? '').localeCompare(a.checked ?? ''))[0]
  const { sources, ...rest } = e
  return newest ? { ...rest, source: { url: newest.url, checked: newest.checked ?? null } } : rest
}

const out = prides
  .map(({ sources, notes, todo, ...p }) => ({
    ...p,
    queerIndex: index[p.country] ?? null,
    editions: p.editions.map(trim),
  }))
  .sort((a, b) => a.id.localeCompare(b.id))

writeFileSync('src/data/prides.json', JSON.stringify(out) + '\n', 'utf8')

const kb = n => `${(n / 1024).toFixed(0)} kB`
console.log(`${out.length} Prides aus ${readdirSync('data/prides').length} Laendern` +
  ` → src/data/prides.json (${kb(JSON.stringify(out).length)})`)

if (warnings.length && !listWarnings) {
  const kinds = {}
  for (const w of warnings) {
    const kind = w.replace(/^[^:]+: /, '').replace(/ —.*$/, '')
    kinds[kind] = (kinds[kind] ?? 0) + 1
  }
  const top = Object.entries(kinds).sort((a, b) => b[1] - a[1])
  console.log(`${warnings.length} Warnung(en): ` +
    top.map(([k, n]) => `${n}× ${k}`).join(', ') + '  (--warnings zeigt sie)')
}
