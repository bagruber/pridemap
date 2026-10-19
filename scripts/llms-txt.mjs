// public/llms.txt is generated: it names the season and the live counts, and
// both change without anyone editing prose.
import { writeFileSync } from 'node:fs'
import { YEAR } from './lib/pages.mjs'
import { loadPrides } from './lib/data.mjs'

const prides = loadPrides()
const dated = prides.filter(p => !p.open).length
const open = prides.length - dated
const countries = [...new Set(prides.map(p => p.country))].sort()

writeFileSync('public/llms.txt', `# Pride Map ${YEAR}

Interactive map and calendar of LGBTQ+ Pride parades across Europe.
Available at https://pridemap.net/

## What this site does

Pride Map shows ${prides.length} Prides across Europe on an interactive MapLibre map.
A Pride is a recurring event with one edition per year, and it keeps the same page
and the same URL across seasons. Dots are coloured by how many days until the next
date; an unfilled ring means the date for ${YEAR} has not been announced yet
(${open} of ${prides.length} at the time of this build, ${dated} already have a date).
Users can filter by country, event size (small under 3,000, medium up to 30,000,
large above, counting spectators) and time frame (upcoming, this weekend, next
weekend, past, all).
A list view with full-text search (including umlaut folding: u finds ü, s finds ß)
is also available.
Search understands the national word for a Pride — CSD, Marche des Fiertés, Orgullo,
Parada Równości and so on — so "Orgullo Madrid", "CSD Berlin" and "Pride Berlin" all
reach the same Pride.
The site supports English and German.

## Data

Each Pride has: city (in the local language, with German and English forms where they
differ), country, region, coordinates, size category, website, Instagram, the first
year it was held, the ILGA-Europe rainbow index score for its country, attendance
figures where known (with the year and who counted), and a list of editions.
Each edition has a year, a date where known, a status (confirmed, announced,
rescheduled, cancelled, unverified) and the source the date came from.
An edition whose date was moved after being announced carries the previous date and
is marked as rescheduled (schema.org EventRescheduled) on its page.

Countries covered: ${countries.join(', ')}.

## Data sources

- Dates and details: researched from official Pride websites, organisers' channels
  and local media. Every date names its source and the day it was last checked.
- Attendance: from authorities, organisers or media reports, with the year.
- ILGA-Europe Rainbow Index scores: https://rainboweurope.ilga-europe.org/

## Technology

Vite + React 19, MapLibre GL JS, deployed to Hostinger and GitHub Pages.
No user tracking for visitors with Do Not Track enabled.
Privacy-respecting analytics via GoatCounter.

## Contact / corrections

Missing a Pride or found an error? Use the suggestion form linked in the app.
`)

console.log(`llms.txt: ${prides.length} Prides, ${open} ohne Termin, ${countries.length} Laender`)
