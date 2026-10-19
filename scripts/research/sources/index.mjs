// The overview pages the comparison knows. Adding one is a parser and an entry
// here; data/sources.json says which page covers which country.
import { parseCsdTermine } from './csd-termine.mjs'
import { parseGayPrideShop } from './gayprideshop.mjs'

export const SOURCES = {
  'csd-de': {
    label: 'csd-termine.de, Deutschland',
    url: () => 'https://www.csd-termine.de/deutschland',
    countries: ['DE'],
    parse: html => parseCsdTermine(html, { country: 'DE' }),
  },
  'csd-europa': {
    label: 'csd-termine.de, Europa',
    url: () => 'https://www.csd-termine.de/europa',
    // Each card names its country
    countries: null,
    parse: html => parseCsdTermine(html),
  },
  'uk-ie': {
    label: 'gayprideshop.co.uk, UK & Irland',
    url: year => `https://gayprideshop.co.uk/pages/uk-ireland-gay-pride-events-calendar-${year}`,
    countries: ['GB', 'IE', 'GG'],
    perYear: true,
    // Its rows link to the organisers; csd-termine.de links to its own pages
    organizerLinks: true,
    parse: (html, { year }) => parseGayPrideShop(html, { year }),
  },
}
