import { describe, it, expect } from 'vitest'
import { summarize } from './status.mjs'

const ed = (year, date, status = 'unverified') => ({ year, date, status })
const pride = (id, country, editions, extra = {}) => ({ id, country, editions, website: 'https://x.example', ...extra })

describe('summarize', () => {
  const prides = [
    pride('de-a', 'DE', [ed(2026, '2026-06-06'), ed(2027, '2027-06-05', 'confirmed')]),
    pride('de-b', 'DE', [ed(2026, '2026-07-04'), ed(2027, '2027-07-03', 'announced')]),
    pride('de-c', 'DE', [ed(2026, '2026-08-01')], { website: null, instagram: null, todo: [{ task: 'link', since: '2026-10-19' }] }),
    pride('de-d', 'DE', [ed(2024, '2024-08-01')]),
    pride('de-e', 'DE', [ed(2026, '2026-11-07')]),
    pride('pl-a', 'PL', [ed(2026, '2026-06-13')]),
  ]
  const sources = {
    DE: { overview: [{ checked: '2026-10-19' }, { checked: null }], lastSweep: '2026-10-19' },
    PL: { overview: [{ checked: '2026-10-01' }], lastSweep: null },
  }
  const { season, rows } = summarize(prides, sources, new Date(2026, 9, 19))

  it('counts against the season, not the calendar year', () => {
    expect(season).toBe(2027)
  })

  it('splits a country by what its Prides have for the season', () => {
    const de = rows.find(r => r.country === 'DE')
    expect(de).toMatchObject({ prides: 5, confirmed: 1, announced: 1, open: 1, ahead: 1, dormant: 1, noLink: 1, findLink: 1 })
  })

  it('reports the stalest overview check, and "nie" for one never checked', () => {
    expect(rows.find(r => r.country === 'DE').checked).toBe('nie')
    expect(rows.find(r => r.country === 'PL').checked).toBe('2026-10-01')
  })
})
