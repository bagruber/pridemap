import { readFileSync, writeFileSync } from 'fs'

const PARADES_PATH = './src/data/parades.json'
let parades = JSON.parse(readFileSync(PARADES_PATH, 'utf8'))

// Remove Bernau Jul 11 duplicate (keep Jun 27)
const before = parades.length
parades = parades.filter(p => !(p.city === 'Bernau bei Berlin' && p.date === '2026-07-11'))
console.log(`Removed ${before - parades.length} Bernau duplicate`)

// Links to apply: matched by city (all dates for that city get the update)
const linkUpdates = [
  { city: 'Tallinn',           website: 'https://www.balticpride.ee/en',               instagram: 'https://www.instagram.com/tallinnpride/' },
  { city: 'Brüssel',           website: 'https://www.brusselspride.eu/en',             instagram: 'https://www.instagram.com/thebrusselspride/' },
  { city: 'Lincoln',           website: 'https://lincolnpride.co.uk/',                 instagram: 'https://www.instagram.com/lincolnprideuk/' },
  { city: 'Portsmouth',        website: 'https://www.portsmouthpride.org.uk/',         instagram: 'https://www.instagram.com/portsmouthprideuk/' },
  { city: 'Swindon',           website: 'https://www.swindonwiltshirepride.org.uk/',   instagram: 'https://www.instagram.com/swinwiltspride/' },
  { city: 'Croydon',           website: 'https://www.croydonpride.org.uk/',            instagram: 'https://www.instagram.com/croydonpride/' },
  { city: 'Avignon',           website: null,                                          instagram: 'https://www.instagram.com/pride.avignon/' },
  { city: 'Mulhouse',          website: null,                                          instagram: 'https://www.instagram.com/pridemulhouse/' },
  { city: 'Dijon',             website: null,                                          instagram: 'https://www.instagram.com/pride.dijon/' },
  { city: 'Tours',             website: null,                                          instagram: 'https://www.instagram.com/fiertes_tours/' },
  { city: 'Amiens',            website: null,                                          instagram: 'https://www.instagram.com/fiertesamiens/' },
  { city: 'Nîmes',             website: null,                                          instagram: 'https://www.instagram.com/larenedesfiertes/' },
  { city: 'Toulon',            website: 'https://fiertes-toulon.fr/',                  instagram: 'https://www.instagram.com/collectif.fiertes.toulon/' },
  { city: 'La Rochelle',       website: 'https://larochellepride.fr/',                 instagram: 'https://www.instagram.com/larochellepride/' },
  { city: 'Caen',              website: null,                                          instagram: 'https://www.instagram.com/centrelgbtinormandie_caen/' },
  { city: 'Brest',             website: null,                                          instagram: 'https://www.instagram.com/pridebrest/' },
  { city: 'Aix-en-Provence',   website: null,                                          instagram: 'https://www.instagram.com/aix_vanguard/' },
  { city: 'Bernau bei Berlin', website: null,                                          instagram: 'https://www.instagram.com/csd_bernau/' },
]

let updated = 0
for (const upd of linkUpdates) {
  const matches = parades.filter(p => p.city === upd.city)
  if (!matches.length) { console.warn(`⚠ Not found: ${upd.city}`); continue }
  for (const p of matches) {
    if (upd.website   && !p.website)   { p.website   = upd.website;   updated++ }
    if (upd.instagram && !p.instagram) { p.instagram = upd.instagram; updated++ }
  }
}

writeFileSync(PARADES_PATH, JSON.stringify(parades, null, 2), 'utf8')
console.log(`✓ Updated ${updated} link fields`)
