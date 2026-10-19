import { describe, it, expect } from 'vitest'
import { season } from './season.js'

const day = iso => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d) }

describe('season', () => {
  it('is the current year until the end of September', () => {
    expect(season(day('2026-01-15'))).toBe(2026)
    expect(season(day('2026-06-10'))).toBe(2026)
    expect(season(day('2026-09-30'))).toBe(2026)
  })

  it('turns over on 1 October', () => {
    expect(season(day('2026-10-01'))).toBe(2027)
    expect(season(day('2026-10-19'))).toBe(2027)
    expect(season(day('2026-12-31'))).toBe(2027)
  })
})
