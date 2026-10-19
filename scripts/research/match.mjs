// Which Pride in data/prides a line on an overview page means, and what that
// line tells us. Pure functions, so the brittle part is the tested part.
import { norm } from '../../src/utils/text.js'
import { slugify } from '../../src/utils/slug.js'

// What "Pride" is called in the listings' languages. Cut from both sides before
// comparing, so "CSD Templin 2027" and the record "CSD Templin" meet on
// "templin". Whole words only: "parade" goes, "Paradeplatz" stays.
const VOCAB_PHRASES = ['christopher-street-day', 'marche-des-fiertes', 'marsz-rownosci', 'parada-rownosci']
const VOCAB_WORDS = new Set([
  'worldpride', 'europride', 'csd', 'pride', 'fiertes', 'orgullo', 'festival', 'parade',
  'march', 'lgbtqia', 'lgbtq', 'lgbt',
])

// Events that live next to a town's Pride rather than being it. Decision E9:
// only the Pride of a place goes on the map, so these are flagged for a person
// to look at instead of being offered as new.
const SIDE_EVENT = /\b(trans|student|family|families|youth|young|black|dyke|picnic|piknik|party|afterparty|ball|run|film|senior|seniors|disabled|weekend|bear|bears|veteran|veterans)\b/

/**
 * A name reduced to what identifies the place: ASCII words (the same
 * transliteration as the slugs, so "Kraków" and "Krakow" meet), no numbers,
 * no Pride vocabulary.
 */
export function nameKey(s) {
  let slug = `-${slugify(s)}-`
  for (const p of VOCAB_PHRASES) slug = slug.replaceAll(`-${p}-`, '-')
  return slug.split('-')
    .filter(w => w && !/^\d+$/.test(w) && !VOCAB_WORDS.has(w))
    // Glued forms, as in "ColognePride"
    .map(w => w.replace(/^([a-z]{3,})(pride|csd)$/, '$1'))
    .join(' ')
}

const keysOfPride = p => new Set(
  [p.city, p.cityNames?.de, p.cityNames?.en, p.name, ...(p.aka ?? [])]
    .filter(Boolean).map(nameKey).filter(k => k.length > 1),
)

const keySet = list => new Set(list.filter(Boolean).map(nameKey).filter(k => k.length > 1))

// "Riga Pride 2027 / CSD Riga 2027": the part before the first slash is the
// event's name, the rest are aliases or, as often, just a place
// ("Sparkle Weekend 2026 / Manchester")
const variantsOf = e => String(e.name ?? '').split(/\s+\/\s+/)
const mainName = e => variantsOf(e)[0]

/** By the event's main name: "Salford Pride / Pink Picnic …" is still Salford Pride. */
export const isSideEvent = name => SIDE_EVENT.test(norm(String(name ?? '').split(/\s+\/\s+/)[0]))

/**
 * The Pride an entry means. `how` says how sure: `genau` when a key matches,
 * `unscharf` when only the town's words appear in the entry, `mehrdeutig` when
 * several Prides fit, `keiner` when none does.
 */
export function matchEntry(entry, prides) {
  const pool = entry.country ? prides.filter(p => p.country === entry.country) : prides
  const mainKeys = keySet([mainName(entry), entry.place])
  const aliasKeys = keySet(variantsOf(entry).slice(1))
  const ek = new Set([...mainKeys, ...aliasKeys])
  const placeKey = entry.place ? nameKey(entry.place) : null
  const hits = keys => pool.filter(p => [...keysOfPride(p)].some(k => keys.has(k)))

  const exact = hits(mainKeys)
  if (exact.length === 1) return { pride: exact[0], how: 'genau', candidates: exact }
  if (exact.length > 1) {
    const byPlace = placeKey ? exact.filter(p => nameKey(p.city) === placeKey) : []
    if (byPlace.length === 1) return { pride: byPlace[0], how: 'genau', candidates: exact }
    return { pride: null, how: 'mehrdeutig', candidates: exact }
  }

  // Only an alias fits: right for "Highland Pride / Inverness", wrong for
  // "Sparkle Weekend / Manchester". A person tells them apart.
  const viaAlias = hits(aliasKeys)
  if (viaAlias.length === 1) return { pride: viaAlias[0], how: 'unscharf', candidates: viaAlias }
  if (viaAlias.length > 1) return { pride: null, how: 'mehrdeutig', candidates: viaAlias }

  // Loosely, in both directions: "St Ives & Hayle Pride" still means St Ives
  // (every word of the town is in the entry), and "CSD Frankfurt" could be
  // Frankfurt am Main or Frankfurt (Oder) (the entry is part of the town).
  const entryWords = new Set([...ek].flatMap(k => k.split(' ')))
  const loose = pool.filter(p => {
    const cityWords = nameKey(p.city).split(' ').filter(Boolean)
    if (cityWords.join('').length < 3) return false
    const cityInEntry = cityWords.every(w => entryWords.has(w))
    const entryInCity = [...ek].some(k => k.length >= 4 && k.split(' ').every(w => cityWords.includes(w)))
    return cityInEntry || entryInCity
  })
  if (loose.length === 1) return { pride: loose[0], how: 'unscharf', candidates: loose }
  if (loose.length > 1) return { pride: null, how: 'mehrdeutig', candidates: loose }
  return { pride: null, how: 'keiner', candidates: [] }
}

/**
 * What an entry means for our data:
 * - `neben`: a side event by its name (Trans Pride, Pride Picnic …), E9
 * - `neu`: no Pride of ours fits
 * - `mehrdeutig`: several fit, a person decides
 * - `unscharf`: one fits, but only loosely; a person confirms before anything
 *   is compared ("Didsbury Pride" contains "Manchester" yet is its own Pride)
 * - `ohne-datum`: known Pride, but the listing has no date ("TBC")
 * - `abgesagt`: the listing says it is cancelled or not happening this year
 * - `termin`: known Pride, the listing has a date for a year we have none for
 * - `abweichung`: we have that year, with another date
 * - `bekannt`: we have that year with the same date
 */
export function classify(entry, match) {
  const ourSideEvent = match.how === 'genau' && isSideEvent(match.pride.name)
  if (isSideEvent(entry.name) && !ourSideEvent) return 'neben'
  if (match.how === 'mehrdeutig') return 'mehrdeutig'
  if (!match.pride) return 'neu'
  if (match.how === 'unscharf') return 'unscharf'
  if (entry.status === 'cancelled') return 'abgesagt'
  if (!entry.date) return 'ohne-datum'
  const year = Number(entry.date.slice(0, 4))
  const ours = match.pride.editions.find(e => e.year === year)
  if (!ours || !ours.date) return 'termin'
  return ours.date === entry.date ? 'bekannt' : 'abweichung'
}

/** The latest edition before `year`, as the plausibility check for a new date. */
export function previousEdition(pride, year) {
  return [...pride.editions]
    .filter(e => e.year < year && e.date)
    .sort((a, b) => b.year - a.year)[0] ?? null
}
