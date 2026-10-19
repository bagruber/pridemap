import { describe, it, expect } from 'vitest'
import { parseCsdTermine, parseGermanDate, countryFromGerman } from './csd-termine.mjs'
import { parseGayPrideShop, parseEnglishDate } from './gayprideshop.mjs'

// Hand-built after the markup of the real pages, not copied from them
const card = (href, name, date, place) => `
  <a href="${href}" class="block overflow-hidden gf-teaser">
    <div class="relative"><img alt="${name}"><span>In 5 Monaten</span></div>
    <div class="p-3 text-small">
      <h3 class="m-0 truncate">${name}</h3>
      <div>${date}</div>            <div>${place}</div>
    </div>
  </a>`

describe('csd-termine.de', () => {
  it('reads German dates', () => {
    expect(parseGermanDate('7. November 2026')).toBe('2026-11-07')
    expect(parseGermanDate('13. März 2027')).toBe('2027-03-13')
    expect(parseGermanDate('irgendwann')).toBe(null)
  })

  it('knows the countries the way the listing writes them', () => {
    expect(countryFromGerman('Lettland')).toBe('LV')
    expect(countryFromGerman('Wales')).toBe('GB')
    expect(countryFromGerman('Schweiz')).toBe('CH')
    expect(countryFromGerman('Atlantis')).toBe(null)
  })

  it('turns cards into entries and skips the repeated highlight card', () => {
    const html = [
      card('https://www.csd-termine.de/deutschland/csd-pride-templin.html', 'CSD Templin 2027', '13. März 2027', 'Templin'),
      '<a href="/impressum">Impressum</a>',
      card('https://www.csd-termine.de/deutschland/csd-pride-templin.html', 'CSD Templin 2027', '13. März 2027', 'Templin'),
      card('https://www.csd-termine.de/europa/csd-pride-riga.html', 'Riga Pride 2027 / CSD Riga 2027', '17. Juni 2027', 'Riga, Lettland'),
    ].join('\n')
    const entries = parseCsdTermine(html, { country: 'DE' })
    expect(entries).toHaveLength(2)
    expect(entries[0]).toMatchObject({ name: 'CSD Templin 2027', date: '2027-03-13', place: 'Templin', country: 'DE' })
    expect(entries[1]).toMatchObject({ date: '2027-06-17', place: 'Riga', country: 'LV', countryLabel: 'Lettland' })
  })
})

const row = (name, href, date) =>
  `<tr><td><meta charset="utf-8"> <a href="${href}" target="_blank">${name}</a></td><td>${date}</td></tr>`

describe('gayprideshop.co.uk', () => {
  it('reads every date shape the page uses', () => {
    expect(parseEnglishDate('25 April 2026', 2026)).toMatchObject({ date: '2026-04-25', endDate: null })
    expect(parseEnglishDate('13-14 February 2026', 2026)).toMatchObject({ date: '2026-02-13', endDate: '2026-02-14' })
    expect(parseEnglishDate('31 July- 1 Aug 2026', 2026)).toMatchObject({ date: '2026-07-31', endDate: '2026-08-01' })
    expect(parseEnglishDate('13 &amp; 14 June 2026', 2026)).toMatchObject({ date: '2026-06-13', endDate: '2026-06-14' })
    expect(parseEnglishDate('TBC', 2026)).toMatchObject({ date: null, status: null })
    expect(parseEnglishDate('Cancelled', 2026).status).toBe('cancelled')
    expect(parseEnglishDate('No 2026 Event', 2026).status).toBe('cancelled')
  })

  it('reads the month tables, drops tracking parameters and keeps the dated duplicate', () => {
    const html = `
      <table><tr><td colspan="2"><h2>May 2026 Pride Events</h2></td></tr>
      ${row('York Pride 2026', 'https://yorkpride.org.uk/?utm_source=gayprideshop.co.uk', '30 May 2026')}
      ${row('Wyre Forest &amp; Wychavon Pride 2026', 'https://example.org/wyre', 'TBC')}</table>
      <table>${row('York Pride 2026', 'https://yorkpride.org.uk/', 'TBC')}
      ${row('York Pride', 'https://yorkpride.org.uk/', '30 May 2026')}</table>`
    const entries = parseGayPrideShop(html, { year: 2026 })
    expect(entries).toHaveLength(2)
    expect(entries[0]).toMatchObject({ name: 'York Pride 2026', date: '2026-05-30', url: 'https://yorkpride.org.uk/' })
    expect(entries[1]).toMatchObject({ name: 'Wyre Forest & Wychavon Pride 2026', date: null })
  })
})
