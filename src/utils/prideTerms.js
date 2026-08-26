// What people actually call a Pride, per country.
//
// Every event on this map is the same kind of event; only the word changes at
// the border. So the vocabulary belongs to the country, not to the event —
// which means one table serves both the search box and the static pages, and
// nobody has to maintain a synonym list on 639 records.
//
// Vite-free on purpose: the prerenderer imports this under plain Node.
import { norm } from './text.js'

// `label` is the short form for headings — left out where it already contains
// the word "Pride" and would read as a stutter. `aka` is everything the search
// should understand, most common first.
export const LOCAL_PRIDE = {
  DE: { label: 'CSD', aka: ['CSD', 'Christopher Street Day'] },
  AT: { label: 'CSD', aka: ['CSD', 'Christopher Street Day', 'Regenbogenparade'] },
  CH: { label: 'CSD', aka: ['CSD', 'Christopher Street Day', 'Marche des Fiertés'] },
  FR: { label: 'Marche des Fiertés', aka: ['Marche des Fiertés', 'Fiertés'] },
  BE: { label: 'Marche des Fiertés', aka: ['Marche des Fiertés', 'Fiertés', 'Roze Zaterdag'] },
  LU: { label: 'Marche des Fiertés', aka: ['Marche des Fiertés', 'Fiertés'] },
  ES: { label: 'Orgullo', aka: ['Orgullo', 'Fiesta del Orgullo', 'Día del Orgullo'] },
  PT: { label: 'Marcha do Orgulho', aka: ['Marcha do Orgulho'] },
  IT: { aka: ['Onda Pride', 'Parata del Pride'] },
  NL: { label: 'Roze Zaterdag', aka: ['Roze Zaterdag', 'Canal Parade'] },
  PL: { label: 'Parada Równości', aka: ['Parada Równości', 'Marsz Równości'] },
  HU: { label: 'Méltóság Menete', aka: ['Méltóság Menete'] },
  HR: { label: 'Povorka ponosa', aka: ['Povorka ponosa'] },
  RS: { label: 'Parada ponosa', aka: ['Parada ponosa'] },
  SI: { label: 'Parada ponosa', aka: ['Parada ponosa'] },
  SE: { aka: ['Prideparaden'] },
}

// Words that mean the same thing everywhere, so they narrow nothing down
const UNIVERSAL = ['Pride', 'Gay Pride', 'Pride Parade', 'Pride March']

// term → country codes it points at, or null for the universal ones.
// Longest first, so "marche des fiertés" is consumed before "fiertés" and
// "gay pride" before "pride".
const TERMS = (() => {
  const byTerm = new Map()
  for (const [code, { aka }] of Object.entries(LOCAL_PRIDE)) {
    for (const label of aka) {
      const term = norm(label)
      byTerm.set(term, [...(byTerm.get(term) ?? []), code])
    }
  }
  for (const label of UNIVERSAL) byTerm.set(norm(label), null)
  return [...byTerm].sort((a, b) => b[0].length - a[0].length)
})()

export const localPride = code => LOCAL_PRIDE[code] ?? null

// Search needs to understand "Fiertés" on its own; a reader does not need to be
// told about it right next to "Marche des Fiertés". Drop anything already
// contained in a term we are showing.
export function displayAka(code) {
  const out = []
  for (const label of LOCAL_PRIDE[code]?.aka ?? []) {
    if (out.some(kept => norm(kept).includes(norm(label)))) continue
    out.push(label)
  }
  return out
}

/**
 * Takes a normalised query and pulls the Pride vocabulary out of it.
 *
 * "orgullo madrid" → { tokens: ['madrid'], countries: null }
 * "orgullo"        → { tokens: [],         countries: ['ES'] }
 * "csd paris"      → { tokens: ['paris'],  countries: null }
 *
 * The country hint only survives when nothing else is left to search on.
 * Otherwise "csd paris" — which a German speaker will absolutely type — would
 * ask for a French city inside the German-speaking countries and find nothing.
 */
export function parsePrideQuery(q) {
  let rest = ` ${q} `
  let countries = null
  for (const [term, codes] of TERMS) {
    const padded = ` ${term} `
    if (!rest.includes(padded)) continue
    rest = rest.split(padded).join(' ')
    if (codes) countries = countries ? countries.filter(c => codes.includes(c)) : codes
  }
  const tokens = rest.split(/\s+/).filter(Boolean)
  return { tokens, countries: tokens.length ? null : countries }
}
