// Just enough HTML handling for the overview pages: their markup is regular,
// and a DOM library would be a dependency for two regexes.

const NAMED = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', nbsp: ' ', ndash: '–', mdash: '—' }

export function decodeHtml(s) {
  return String(s ?? '')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+);/gi, (m, n) => NAMED[n.toLowerCase()] ?? m)
}

/** Visible text of a fragment, whitespace collapsed. */
export const textOf = html =>
  decodeHtml(String(html ?? '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()

/** A listing's link without the tracking parameters it adds. */
export function cleanUrl(href) {
  if (!href) return null
  try {
    const u = new URL(decodeHtml(href), 'https://example.invalid')
    if (u.hostname === 'example.invalid') return null
    for (const k of [...u.searchParams.keys()]) if (/^utm_/i.test(k)) u.searchParams.delete(k)
    return u.toString()
  } catch {
    return null
  }
}
