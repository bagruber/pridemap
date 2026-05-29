import fs from 'fs'

const parades = JSON.parse(fs.readFileSync('./src/data/parades.json', 'utf8'))

const today = new Date()
today.setHours(0, 0, 0, 0)

const events = parades
  .filter(p => new Date(p.date) >= today)
  .sort((a, b) => new Date(a.date) - new Date(b.date))
  .map(p => {
    const e = {
      '@type': 'Event',
      name: p.name || `${p.city} Pride`,
      startDate: p.date,
      eventStatus: 'https://schema.org/EventScheduled',
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      location: {
        '@type': 'Place',
        name: p.city,
        address: {
          '@type': 'PostalAddress',
          addressLocality: p.city,
          addressCountry: p.country,
        },
      },
      organizer: { '@type': 'Organization', name: p.name || `${p.city} Pride` },
    }
    if (p.website) e.url = p.website
    return e
  })

const jsonld = JSON.stringify({
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      name: 'Pride Map 2026',
      url: 'https://lavender-lobster-412344.hostingersite.com/',
      description: 'Interactive map and calendar of 600+ LGBTQ+ Pride parades across Europe in 2026.',
      inLanguage: ['en', 'de'],
    },
    ...events,
  ],
})

const tag = `<script type="application/ld+json">${jsonld}</script>`
const indexPath = './dist/index.html'
const html = fs.readFileSync(indexPath, 'utf8').replace('</head>', `${tag}\n</head>`)
fs.writeFileSync(indexPath, html)
console.log(`JSON-LD: injected ${events.length} upcoming events`)
