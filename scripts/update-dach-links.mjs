import { readFileSync, writeFileSync } from 'fs'

const PARADES_PATH = './src/data/parades.json'
const parades = JSON.parse(readFileSync(PARADES_PATH, 'utf8'))

const isIg = url => url && url.includes('instagram.com')

const updates = [
  { ort: 'Angermünde',              website: null,                                    instagram: 'https://www.instagram.com/pride.angermuende.official/' },
  { ort: 'Schönebeck',              website: null,                                    instagram: 'https://www.instagram.com/csdschoenebeck/' },
  { ort: 'Schwedt/Oder',            website: null,                                    instagram: 'https://www.instagram.com/csdangermuende_csdschwedt_oder/' },
  { ort: 'Dessau-Rosslau',          website: null,                                    instagram: 'https://www.instagram.com/csddessaurosslau/' },
  { ort: 'Potsdam',                 website: null,                                    instagram: 'https://www.instagram.com/csdpotsdam/' },
  { ort: 'Limburg an der Lahn',     website: null,                                    instagram: 'https://www.instagram.com/csdlimburg/' },
  { ort: 'Hannover',                website: 'https://www.hannovercsd.de/',            instagram: 'https://www.instagram.com/csd_hannover/' },
  { ort: 'Norderstedt',             website: null,                                    instagram: 'https://www.instagram.com/csd_norderstedt/' },
  { ort: 'Euskirchen',              website: null,                                    instagram: 'https://www.instagram.com/queer.eu/' },
  { ort: 'Saarbrücken',             website: null,                                    instagram: 'https://www.instagram.com/lsvdsaar/' },
  { ort: 'Warendorf',               website: null,                                    instagram: 'https://www.instagram.com/csd_warendorf/' },
  { ort: 'Dresden',                 website: 'https://www.queerpridedd.org/',          instagram: 'https://www.instagram.com/csddresden/' },
  { ort: 'Düsseldorf',              website: 'https://www.csd-d.de/de/',              instagram: 'https://www.instagram.com/csdduesseldorf/' },
  { ort: 'Paderborn',               website: null,                                    instagram: 'https://www.instagram.com/paderpride/' },
  { ort: 'Karlsruhe',               website: 'https://www.csd-karlsruhe.de/',         instagram: 'https://www.instagram.com/csdkarlsruhe/' },
  { ort: 'Rosenheim',               website: null,                                    instagram: 'https://www.instagram.com/csd_rosenheim/' },
  { ort: 'Kelheim',                 website: 'https://queer-niederbayern.de/',         instagram: null },
  { ort: 'Celle',                   website: null,                                    instagram: 'https://www.instagram.com/csd_celle/' },
  { ort: 'Hameln',                  website: null,                                    instagram: 'https://www.instagram.com/csd_weserbergland/' },
  { ort: 'Bielefeld',               website: 'https://csd-bielefeld.de/',             instagram: 'https://www.instagram.com/csdbielefeld/' },
  { ort: 'Kassel',                  website: null,                                    instagram: 'https://www.instagram.com/csdkassel/' },
  { ort: 'Augsburg',                website: null,                                    instagram: 'https://www.instagram.com/csdaugsburg/' },
  { ort: 'Emden',                   website: null,                                    instagram: 'https://www.instagram.com/csdemden/' },
  { ort: 'Pforzheim',               website: null,                                    instagram: 'https://www.instagram.com/queer.space.pf/' },
  { ort: 'Hofheim am Taunus',       website: 'https://csdmtk.de/',                   instagram: null },
  { ort: 'Wiesbaden',               website: 'https://www.csd-wiesbaden.de/',         instagram: null },
  { ort: 'Osnabrück',               website: null,                                    instagram: 'https://www.instagram.com/csd_osnabrueck/' },
  { ort: 'Frankfurt (Oder)',         website: null,                                    instagram: 'https://www.instagram.com/slubice.frankfurt.pride/' },
  { ort: 'Wien',                    website: 'https://viennapride.at/',               instagram: null },
  { ort: 'Oldenburg',               website: null,                                    instagram: 'https://www.instagram.com/csdnordwest/' },
  { ort: 'Freiburg im Breisgau',    website: 'https://freiburg-pride.de/',            instagram: 'https://www.instagram.com/csdfreiburg/' },
  { ort: 'Ulm',                     website: 'https://www.csd-ulm.de/',              instagram: null },
  { ort: 'Wetzlar',                 website: 'https://csdmittelhessen.de/',           instagram: null },
  { ort: 'Jena',                    website: 'https://www.csd-jena.de/',              instagram: null },
  { ort: 'Bochum',                  website: 'https://csdbochum.wordpress.com/',      instagram: null },
  { ort: 'Coburg',                  website: null,                                    instagram: null },
  { ort: 'Heidelberg',              website: null,                                    instagram: null },
  { ort: 'Herrenberg',              website: null,                                    instagram: 'https://www.instagram.com/csd_herrenberg/' },
  { ort: 'Zürich',                  website: 'https://zurichpridefestival.ch/',       instagram: 'https://www.instagram.com/csd_zureich/' },
  { ort: 'Tübingen',                website: null,                                    instagram: null },
  { ort: 'München',                 website: 'https://www.csdmuenchen.de/de/',        instagram: 'https://www.instagram.com/csdmuenchen/' },
  { ort: 'Weimar',                  website: 'https://www.csd-weimar.de/',            instagram: null },
  { ort: 'Würzburg',                website: 'https://www.queerpridewue.de/',         instagram: 'https://www.instagram.com/queerpridewue/' },
  { ort: 'Hanau',                   website: 'https://csdhanau.de/',                  instagram: null },
  { ort: 'Marburg',                 website: 'https://csd-marburg.com/',              instagram: null },
  { ort: 'Nordenham',               website: 'https://www.csd-wesermarsch.de/',       instagram: null },
  { ort: 'Torgau',                  website: null,                                    instagram: 'https://www.instagram.com/csd_torgau/' },
  { ort: 'Innsbruck',               website: 'https://pride.tirol/',                  instagram: null },
  { ort: 'St. Pölten',              website: null,                                    instagram: 'https://www.instagram.com/stp.pride/' },
  { ort: 'Bern',                    website: 'https://csd-bern.ch/',                  instagram: 'https://www.instagram.com/csd_bern/' },
  { ort: 'Hamburg',                 website: 'https://www.hamburg-pride.de/',         instagram: 'https://www.instagram.com/hamburgpride/' },
  { ort: 'Gifhorn',                 website: 'https://www.queeres-netzwerk-gf.de/',   instagram: null },
  { ort: 'Esslingen am Neckar',     website: null,                                    instagram: 'https://www.instagram.com/csd.esslingen/' },
  { ort: 'Köthen',                  website: null,                                    instagram: 'https://www.instagram.com/csd_koethen/' },
  { ort: 'Freiberg',                website: null,                                    instagram: 'https://www.instagram.com/junges_netzwerk_fg/' },
  { ort: 'Köln',                    website: 'https://www.colognepride.de/',          instagram: 'https://www.instagram.com/cologneprideofficial/' },
  { ort: 'Schwerin',                website: null,                                    instagram: 'https://www.instagram.com/csd_schwerin/' },
  { ort: 'Regensburg',              website: 'https://www.queeresregensburg.de/csd/', instagram: 'https://www.instagram.com/csd_regensburg/' },
  { ort: 'Pirna',                   website: null,                                    instagram: 'https://www.instagram.com/csdpirna/' },
  { ort: 'Mannheim',                website: null,                                    instagram: 'https://www.instagram.com/monnempride/' },
  { ort: 'Kiel',                    website: 'https://csd-kiel.de/',                  instagram: 'https://www.instagram.com/csdkiel/' },
  { ort: 'Cottbus',                 website: 'https://www.csd-cottbus.info/',         instagram: null },
  { ort: 'Bamberg',                 website: null,                                    instagram: 'https://www.instagram.com/csd_bamberg/' },
  { ort: 'Überlingen',              website: 'https://www.csd-ueberlingen.de/',       instagram: null },
  { ort: 'Schwabach',               website: null,                                    instagram: 'https://www.instagram.com/csdschwabach/' },
  { ort: 'Heilbronn',               website: null,                                    instagram: 'https://www.instagram.com/csd_heilbronn/' },
  { ort: 'Memmingen',               website: null,                                    instagram: 'https://www.instagram.com/pridememmingen/' },
  { ort: 'Leipzig',                 website: 'https://csd-leipzig.de/',               instagram: null },
  { ort: 'Frankfurt am Main',       website: 'https://csd-frankfurt.de/',             instagram: 'https://www.instagram.com/csdfrankfurt/' },
  { ort: 'Rostock',                 website: null,                                    instagram: 'https://www.instagram.com/csd_rostock/' },
  { ort: 'Trier',                   website: null,                                    instagram: 'https://www.instagram.com/pride_trier_/' },
  { ort: 'Bonn',                    website: null,                                    instagram: 'https://www.instagram.com/rheinqueer/' },
  { ort: 'Landsberg am Lech',       website: null,                                    instagram: 'https://www.instagram.com/csd.landsberg/' },
  { ort: 'Berlin',                  website: 'https://csd-berlin.de/',                instagram: 'https://www.instagram.com/csd.berlin.pride/' },
  { ort: 'Stuttgart',               website: 'https://www.stuttgart-pride.de/',       instagram: null },
  { ort: 'Duisburg',                website: null,                                    instagram: 'https://www.instagram.com/csdduisburg/' },
  { ort: 'Mainz',                   website: null,                                    instagram: 'https://www.instagram.com/csdmainz/' },
  { ort: 'Linz',                    website: 'https://www.hosilinz.at/linzpride2023/', instagram: null },
  { ort: 'Bregenz',                 website: null,                                    instagram: 'https://www.instagram.com/csdvorarlberg/' },
  { ort: 'Graz',                    website: 'https://www.csd-graz.at/',              instagram: null },
  { ort: 'Basel',                   website: 'https://baselticktbunt.ch/',            instagram: null },
  { ort: 'Lausanne',                website: null,                                    instagram: 'https://www.instagram.com/lausannepride/' },
  { ort: 'Braunschweig',            website: 'https://www.csd-braunschweig.de/',      instagram: null },
  { ort: 'Essen',                   website: 'https://www.ruhrpride.de/',             instagram: null },
  { ort: 'Nürnberg',                website: 'https://www.csd-nuernberg.de/',         instagram: 'https://www.instagram.com/csdnuernberg/' },
  { ort: 'Darmstadt',               website: 'https://www.csd-darmstadt.de/',         instagram: null },
  { ort: 'Unken',                   website: null,                                    instagram: 'https://www.instagram.com/unkenpride/' },
  { ort: 'Hof (Saale)',             website: null,                                    instagram: null },
  { ort: 'Neustift im Stubaital',   website: null,                                    instagram: null },
]

let updated = 0, notFound = 0

for (const upd of updates) {
  // Resolve website: if it's an IG URL, treat as instagram instead
  let website   = upd.website   && !isIg(upd.website)   ? upd.website   : null
  let instagram = upd.instagram && isIg(upd.instagram)  ? upd.instagram : null
  // If website was an IG URL, promote it
  if (upd.website && isIg(upd.website) && !instagram) instagram = upd.website

  if (!website && !instagram) continue  // nothing to update

  const matches = parades.filter(p => p.city === upd.ort)
  if (!matches.length) {
    console.warn(`⚠ No entry found for "${upd.ort}" — skipped`)
    notFound++
    continue
  }

  for (const p of matches) {
    if (website   && !p.website)   { p.website   = website;   updated++ }
    if (instagram && !p.instagram) { p.instagram = instagram; updated++ }
  }
}

writeFileSync(PARADES_PATH, JSON.stringify(parades, null, 2), 'utf8')
console.log(`✓ Updated ${updated} fields across DACH entries (${notFound} cities not found)`)
