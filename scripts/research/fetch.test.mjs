import { describe, it, expect } from 'vitest'
import { robotsAllows } from './fetch.mjs'

// The rules csd-termine.de published on 19.10.2026
const CSD = `User-agent: *
Disallow: /impressum
Disallow: /eintragen
Disallow: /*?*
Disallow: /*.pdf$

User-agent: facebookexternalhit
User-agent: meta-externalfetcher
Allow: /`

describe('robotsAllows', () => {
  it('lets through what is not forbidden', () => {
    expect(robotsAllows(CSD, '/deutschland')).toBe(true)
    expect(robotsAllows(CSD, '/europa')).toBe(true)
  })

  it('honours prefixes, wildcards and the end anchor', () => {
    expect(robotsAllows(CSD, '/impressum')).toBe(false)
    expect(robotsAllows(CSD, '/tabelle?monat=7')).toBe(false)
    expect(robotsAllows(CSD, '/download/termine.pdf')).toBe(false)
    expect(robotsAllows(CSD, '/download/termine.pdf.html')).toBe(true)
  })

  it('prefers a group that names us, and the longer rule within it', () => {
    const txt = `User-agent: *\nDisallow: /\n\nUser-agent: pridemap-recherche\nDisallow: /privat\nAllow: /privat/liste`
    expect(robotsAllows(txt, '/europa')).toBe(true)
    expect(robotsAllows(txt, '/privat/x')).toBe(false)
    expect(robotsAllows(txt, '/privat/liste')).toBe(true)
  })

  it('treats a missing robots.txt as no rules', () => {
    expect(robotsAllows('', '/anything')).toBe(true)
  })
})
