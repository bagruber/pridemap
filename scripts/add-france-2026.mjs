import { readFileSync, writeFileSync } from 'fs'

const PARADES_PATH   = './src/data/parades.json'
const ATTENDANCE_PATH = './src/data/attendance.json'

const parades    = JSON.parse(readFileSync(PARADES_PATH, 'utf8'))
const attendance = JSON.parse(readFileSync(ATTENDANCE_PATH, 'utf8'))

const CITY_STORED = {
  'Straßburg': 'Straßburg',
  'Nizza':     'Nizza',
}

const SIZE = { klein: 'small', mittel: 'medium', groß: 'large' }

const COORDS = {
  'Molines-en-Queyras':       [44.740,  6.893],
  'Bourg-en-Bresse':          [46.205,  5.228],
  'Agen':                     [44.204,  0.621],
  'Libourne':                 [44.920, -0.240],
  'Besançon':                 [47.238,  6.024],
  'Blois':                    [47.594,  1.332],
  'La Roche-sur-Yon':         [46.670, -1.426],
  'Saint-Jean-de-Maurienne':  [45.275,  6.344],
  'Saint-Paul-lès-Dax':       [43.731, -1.055],
  'Valence':                  [44.933,  4.892],
  'Vannes':                   [47.658, -2.760],
  'Bourgoin-Jallieu':         [45.589,  5.271],
  'Reims':                    [49.258,  4.032],
  'Poitiers':                 [46.580,  0.340],
  'Lens':                     [50.432,  2.830],
  'Alençon':                  [48.430,  0.094],
  'Angers':                   [47.473, -0.551],
  'Avignon':                  [43.949,  4.806],
  'Belfort':                  [47.637,  6.863],
  'Bordeaux':                 [44.837, -0.579],
  'Clermont-Ferrand':         [45.776,  3.087],
  "L'Arbresle":               [45.836,  4.607],
  'Laval':                    [48.073, -0.771],
  'Lille':                    [50.629,  3.057],
  'Narbonne':                 [43.184,  3.003],
  'Niort':                    [46.323, -0.462],
  'Orléans':                  [47.903,  1.909],
  'Rodez':                    [44.350,  2.575],
  'Saint-Nazaire':            [47.273, -2.213],
  'Tarbes':                   [43.233,  0.078],
  'Aix-en-Provence':          [43.530,  5.447],
  'Angoulême':                [45.649,  0.157],
  'Arles':                    [43.677,  4.630],
  'Avallon':                  [47.486,  3.908],
  'Bourges':                  [47.081,  2.398],
  'Calais':                   [50.951,  1.858],
  'Chartres':                 [48.448,  1.488],
  'Douai':                    [50.371,  3.080],
  'Douarnenez':               [48.097, -4.327],
  'Fougères':                 [48.352, -1.199],
  'La Ciotat':                [43.174,  5.606],
  'La Rochelle':              [46.160, -1.152],
  'Mulhouse':                 [47.750,  7.336],
  'Nancy':                    [48.692,  6.184],
  'Roubaix':                  [50.694,  3.181],
  'Saint-Gaudens':            [43.107,  0.724],
  'Saint-Quentin':            [49.847,  3.288],
  'Thionville':               [49.358,  6.167],
  'Toulouse':                 [43.605,  1.444],
  'Tours':                    [47.394,  0.688],
  'Alès':                     [44.127,  4.082],
  'Arras':                    [50.292,  2.778],
  'Auxerre':                  [47.798,  3.569],
  'Béziers':                  [43.344,  3.216],
  'Biarritz':                 [43.483, -1.559],
  'Caen':                     [49.182, -0.371],
  'Compiègne':                [49.418,  2.823],
  'Dijon':                    [47.322,  5.041],
  'Lons-le-Saunier':          [46.674,  5.554],
  'Metz':                     [49.120,  6.177],
  'Montauban':                [44.017,  1.353],
  'Nantes':                   [47.218, -1.554],
  'Nevers':                   [46.989,  3.159],
  'Périgueux':                [45.185,  0.721],
  'Perpignan':                [42.699,  2.895],
  'Saint-Brieuc':             [48.514, -2.765],
  'Saintes':                  [45.747, -0.640],
  'Toulon':                   [43.124,  5.928],
  'Brest':                    [48.390, -4.486],
  'Grenoble':                 [45.188,  5.724],
  'Guéret':                   [46.170,  1.873],
  'Montpellier':              [43.611,  3.877],
  'Rennes':                   [48.117, -1.678],
  'Rouen':                    [49.442,  1.100],
  'Saint-Martin-en-Haut':     [45.662,  4.523],
  'Straßburg':                [48.574,  7.752],
  'Vesoul':                   [47.622,  6.157],
  'Amiens':                   [49.895,  2.302],
  'Carcassonne':              [43.213,  2.354],
  'Lisieux':                  [49.144,  0.228],
  'Lorient':                  [47.749, -3.368],
  'Lyon':                     [45.750,  4.845],
  'Nîmes':                    [43.837,  4.361],
  'Paris':                    [48.860,  2.347],
  'Sallanches':               [45.936,  6.632],
  'Tourcoing':                [50.724,  3.161],
  'Cluny':                    [46.434,  4.658],
  'Le Mans':                  [48.006,  0.200],
  'Marseille':                [43.296,  5.381],
  'Quimper':                  [47.996, -4.098],
  'Roanne':                   [46.037,  4.070],
  'Nizza':                    [43.711,  7.262],
  'Annecy':                   [45.899,  6.130],
  'Chenevelles':              [46.558,  0.559],
  'Pontrieux':                [48.702, -3.148],
  'Clisson':                  [47.087, -1.279],
  'Chambéry':                 [45.564,  5.917],
}

const isIg = url => url && url.includes('instagram.com')

function makeId(name, date) {
  return name.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    + '-' + date
}

const franceData = [
  { name: 'Molines-en-Queyras Pride',       ort: 'Molines-en-Queyras',      datum: '2026-01-31', link: null,                                                                                 größe: 'klein', besucher: null },
  { name: 'Bourg-en-Bresse Pride',           ort: 'Bourg-en-Bresse',         datum: '2026-03-28', link: null,                                                                                 größe: 'klein', besucher: null },
  { name: 'Agen Pride',                      ort: 'Agen',                    datum: '2026-05-09', link: 'https://www.agen.fr/en-ce-moment/agenda/evenement/4-eme-marche-des-fiertes-du-lot-et-garonne', größe: 'klein', besucher: null },
  { name: 'Libourne Pride',                  ort: 'Libourne',                datum: '2026-05-09', link: null,                                                                                 größe: 'klein', besucher: null },
  { name: 'Besançon Pride',                  ort: 'Besançon',                datum: '2026-05-16', link: 'https://www.lechni.info/20260414/en-franche-comte-plusieurs-marches-des-fiertes-prevues-pour-2026/', größe: 'mittel', besucher: null },
  { name: 'Blois Pride',                     ort: 'Blois',                   datum: '2026-05-16', link: 'https://www.blois.fr/',                                                              größe: 'klein', besucher: null },
  { name: 'La Roche-sur-Yon Pride',          ort: 'La Roche-sur-Yon',        datum: '2026-05-16', link: 'https://centre-lgbt-de-vendee.org/pride-2026/',                                     größe: 'klein', besucher: null },
  { name: 'Saint-Jean-de-Maurienne Pride',   ort: 'Saint-Jean-de-Maurienne', datum: '2026-05-16', link: null,                                                                                 größe: 'klein', besucher: null },
  { name: 'Saint-Paul-lès-Dax Pride',        ort: 'Saint-Paul-lès-Dax',      datum: '2026-05-16', link: 'https://www.pride40.org/',                                                          größe: 'klein', besucher: null },
  { name: 'Valence Pride',                   ort: 'Valence',                 datum: '2026-05-16', link: 'https://www.valencediversite.fr/',                                                   größe: 'mittel', besucher: null },
  { name: 'Vannes Pride',                    ort: 'Vannes',                  datum: '2026-05-16', link: 'https://www.helloasso.com/associations/liberty-max-vannes/collectes/pride-lgbtqia-de-vannes-2026-1', größe: 'klein', besucher: null },
  { name: 'Bourgoin-Jallieu Pride',          ort: 'Bourgoin-Jallieu',        datum: '2026-05-23', link: null,                                                                                 größe: 'klein', besucher: null },
  { name: 'Reims Pride',                     ort: 'Reims',                   datum: '2026-05-23', link: 'https://www.reims.fr/a-la-une/une/la-marche-des-fiertes-de-reims',                  größe: 'mittel', besucher: { anzahl: 2000, jahr: 2025 } },
  { name: 'Poitiers Pride',                  ort: 'Poitiers',                datum: '2026-05-23', link: null,                                                                                 größe: 'mittel', besucher: null },
  { name: 'Lens Pride',                      ort: 'Lens',                    datum: '2026-05-24', link: null,                                                                                 größe: 'klein', besucher: null },
  { name: 'Alençon Pride',                   ort: 'Alençon',                 datum: '2026-05-30', link: null,                                                                                 größe: 'klein', besucher: null },
  { name: 'Angers Pride',                    ort: 'Angers',                  datum: '2026-05-30', link: null,                                                                                 größe: 'mittel', besucher: null },
  { name: 'Avignon Pride',                   ort: 'Avignon',                 datum: '2026-05-30', link: null,                                                                                 größe: 'mittel', besucher: null },
  { name: 'Belfort Pride',                   ort: 'Belfort',                 datum: '2026-05-30', link: null,                                                                                 größe: 'klein', besucher: null },
  { name: 'Bordeaux Pride',                  ort: 'Bordeaux',                datum: '2026-05-30', link: 'https://www.bordeaux-tourisme.com/',                                                 größe: 'groß',  besucher: { anzahl: 10000, jahr: 2024 } },
  { name: 'Clermont-Ferrand Pride',          ort: 'Clermont-Ferrand',        datum: '2026-05-30', link: 'https://pommesdelune.fr/',                                                           größe: 'mittel', besucher: null },
  { name: "L'Arbresle Pride",                ort: "L'Arbresle",              datum: '2026-05-30', link: null,                                                                                 größe: 'klein', besucher: null },
  { name: 'Laval Pride',                     ort: 'Laval',                   datum: '2026-05-30', link: 'https://www.instagram.com/gom53/',                                                   größe: 'klein', besucher: null },
  { name: 'Lille Pride',                     ort: 'Lille',                   datum: '2026-05-30', link: 'https://www.lillepride.fr/',                                                         größe: 'groß',  besucher: { anzahl: 20000, jahr: 2025 } },
  { name: 'Narbonne Pride',                  ort: 'Narbonne',                datum: '2026-05-30', link: null,                                                                                 größe: 'klein', besucher: null },
  { name: 'Niort Pride',                     ort: 'Niort',                   datum: '2026-05-30', link: null,                                                                                 größe: 'klein', besucher: null },
  { name: 'Orléans Pride',                   ort: 'Orléans',                 datum: '2026-05-30', link: null,                                                                                 größe: 'mittel', besucher: null },
  { name: 'Rodez Pride',                     ort: 'Rodez',                   datum: '2026-05-30', link: null,                                                                                 größe: 'klein', besucher: null },
  { name: 'Saint-Nazaire Pride',             ort: 'Saint-Nazaire',           datum: '2026-05-30', link: null,                                                                                 größe: 'klein', besucher: null },
  { name: 'Tarbes Pride',                    ort: 'Tarbes',                  datum: '2026-05-30', link: null,                                                                                 größe: 'klein', besucher: null },
  { name: 'Aix-en-Provence Pride',           ort: 'Aix-en-Provence',         datum: '2026-06-06', link: null,                                                                                 größe: 'mittel', besucher: null },
  { name: 'Angoulême Pride',                 ort: 'Angoulême',               datum: '2026-06-06', link: null,                                                                                 größe: 'klein', besucher: null },
  { name: 'Arles Pride',                     ort: 'Arles',                   datum: '2026-06-06', link: null,                                                                                 größe: 'klein', besucher: null },
  { name: 'Avallon Pride',                   ort: 'Avallon',                 datum: '2026-06-06', link: null,                                                                                 größe: 'klein', besucher: null },
  { name: 'Bourges Pride',                   ort: 'Bourges',                 datum: '2026-06-06', link: null,                                                                                 größe: 'klein', besucher: null },
  { name: 'Calais Pride',                    ort: 'Calais',                  datum: '2026-06-06', link: null,                                                                                 größe: 'klein', besucher: null },
  { name: 'Chartres Pride',                  ort: 'Chartres',                datum: '2026-06-06', link: null,                                                                                 größe: 'klein', besucher: null },
  { name: 'Douai Pride',                     ort: 'Douai',                   datum: '2026-06-06', link: null,                                                                                 größe: 'klein', besucher: null },
  { name: 'Douarnenez Pride',                ort: 'Douarnenez',              datum: '2026-06-06', link: null,                                                                                 größe: 'klein', besucher: null },
  { name: 'Fougères Pride',                  ort: 'Fougères',                datum: '2026-06-06', link: null,                                                                                 größe: 'klein', besucher: null },
  { name: 'La Ciotat Pride',                 ort: 'La Ciotat',               datum: '2026-06-06', link: null,                                                                                 größe: 'klein', besucher: null },
  { name: 'La Rochelle Pride',               ort: 'La Rochelle',             datum: '2026-06-06', link: null,                                                                                 größe: 'mittel', besucher: null },
  { name: 'Mulhouse Pride',                  ort: 'Mulhouse',                datum: '2026-06-06', link: null,                                                                                 größe: 'mittel', besucher: null },
  { name: 'Nancy Pride',                     ort: 'Nancy',                   datum: '2026-06-06', link: null,                                                                                 größe: 'mittel', besucher: null },
  { name: 'Roubaix Pride',                   ort: 'Roubaix',                 datum: '2026-06-06', link: null,                                                                                 größe: 'mittel', besucher: null },
  { name: 'Saint-Gaudens Pride',             ort: 'Saint-Gaudens',           datum: '2026-06-06', link: null,                                                                                 größe: 'klein', besucher: null },
  { name: 'Saint-Quentin Pride',             ort: 'Saint-Quentin',           datum: '2026-06-06', link: null,                                                                                 größe: 'klein', besucher: null },
  { name: 'Thionville Pride',                ort: 'Thionville',              datum: '2026-06-06', link: null,                                                                                 größe: 'klein', besucher: null },
  { name: 'Toulouse Pride',                  ort: 'Toulouse',                datum: '2026-06-06', link: 'https://www.pridetoulouse.com/',                                                     größe: 'groß',  besucher: { anzahl: 30000, jahr: 2025 } },
  { name: 'Tours Pride',                     ort: 'Tours',                   datum: '2026-06-06', link: null,                                                                                 größe: 'mittel', besucher: null },
  { name: 'Alès Pride',                      ort: 'Alès',                    datum: '2026-06-13', link: null,                                                                                 größe: 'klein', besucher: null },
  { name: 'Arras Pride',                     ort: 'Arras',                   datum: '2026-06-13', link: null,                                                                                 größe: 'klein', besucher: null },
  { name: 'Auxerre Pride',                   ort: 'Auxerre',                 datum: '2026-06-13', link: null,                                                                                 größe: 'klein', besucher: null },
  { name: 'Béziers Pride',                   ort: 'Béziers',                 datum: '2026-06-13', link: null,                                                                                 größe: 'klein', besucher: null },
  { name: 'Biarritz Pride',                  ort: 'Biarritz',                datum: '2026-06-13', link: null,                                                                                 größe: 'klein', besucher: null },
  { name: 'Caen Pride',                      ort: 'Caen',                    datum: '2026-06-13', link: null,                                                                                 größe: 'mittel', besucher: null },
  { name: 'Compiègne Pride',                 ort: 'Compiègne',               datum: '2026-06-13', link: null,                                                                                 größe: 'klein', besucher: null },
  { name: 'Dijon Pride',                     ort: 'Dijon',                   datum: '2026-06-13', link: null,                                                                                 größe: 'mittel', besucher: { anzahl: 1500, jahr: 2025 } },
  { name: 'Lons-le-Saunier Pride',           ort: 'Lons-le-Saunier',         datum: '2026-06-13', link: null,                                                                                 größe: 'klein', besucher: null },
  { name: 'Metz Pride',                      ort: 'Metz',                    datum: '2026-06-13', link: 'https://www.couleursgaies.fr/',                                                      größe: 'mittel', besucher: { anzahl: 5000, jahr: 2025 } },
  { name: 'Montauban Pride',                 ort: 'Montauban',               datum: '2026-06-13', link: null,                                                                                 größe: 'klein', besucher: null },
  { name: 'Nantes Pride',                    ort: 'Nantes',                  datum: '2026-06-13', link: 'https://www.nosig.fr/',                                                              größe: 'groß',  besucher: { anzahl: 12000, jahr: 2025 } },
  { name: 'Nevers Pride',                    ort: 'Nevers',                  datum: '2026-06-13', link: null,                                                                                 größe: 'klein', besucher: null },
  { name: 'Périgueux Pride',                 ort: 'Périgueux',               datum: '2026-06-13', link: null,                                                                                 größe: 'klein', besucher: null },
  { name: 'Perpignan Pride',                 ort: 'Perpignan',               datum: '2026-06-13', link: null,                                                                                 größe: 'mittel', besucher: null },
  { name: 'Saint-Brieuc Pride',              ort: 'Saint-Brieuc',            datum: '2026-06-13', link: null,                                                                                 größe: 'klein', besucher: null },
  { name: 'Saintes Pride',                   ort: 'Saintes',                 datum: '2026-06-13', link: null,                                                                                 größe: 'klein', besucher: null },
  { name: 'Toulon Pride',                    ort: 'Toulon',                  datum: '2026-06-13', link: null,                                                                                 größe: 'mittel', besucher: null },
  { name: 'Brest Pride',                     ort: 'Brest',                   datum: '2026-06-20', link: null,                                                                                 größe: 'mittel', besucher: null },
  { name: 'Grenoble Pride',                  ort: 'Grenoble',                datum: '2026-06-20', link: 'https://grenoble-fiertes.com/',                                                      größe: 'mittel', besucher: { anzahl: 4000, jahr: 2025 } },
  { name: 'Guéret Pride',                    ort: 'Guéret',                  datum: '2026-06-20', link: null,                                                                                 größe: 'klein', besucher: null },
  { name: 'Montpellier Pride',               ort: 'Montpellier',             datum: '2026-06-20', link: 'https://www.montpellier.fr/',                                                        größe: 'groß',  besucher: { anzahl: 20000, jahr: 2025 } },
  { name: 'Rennes Pride',                    ort: 'Rennes',                  datum: '2026-06-20', link: 'https://www.iskis-rbx.fr/',                                                          größe: 'groß',  besucher: { anzahl: 8000, jahr: 2025 } },
  { name: 'Rouen Pride',                     ort: 'Rouen',                   datum: '2026-06-20', link: 'https://www.normandie-pride.fr/',                                                    größe: 'mittel', besucher: { anzahl: 5000, jahr: 2025 } },
  { name: 'Saint-Martin-en-Haut Pride',      ort: 'Saint-Martin-en-Haut',    datum: '2026-06-20', link: null,                                                                                 größe: 'klein', besucher: null },
  { name: 'Strasbourg Pride',                ort: 'Straßburg',               datum: '2026-06-20', link: 'https://www.festigays.net/',                                                         größe: 'groß',  besucher: { anzahl: 7000, jahr: 2025 } },
  { name: 'Vesoul Pride',                    ort: 'Vesoul',                  datum: '2026-06-20', link: null,                                                                                 größe: 'klein', besucher: null },
  { name: 'Amiens Pride',                    ort: 'Amiens',                  datum: '2026-06-27', link: null,                                                                                 größe: 'mittel', besucher: null },
  { name: 'Carcassonne Pride',               ort: 'Carcassonne',             datum: '2026-06-27', link: null,                                                                                 größe: 'klein', besucher: null },
  { name: 'Lisieux Pride',                   ort: 'Lisieux',                 datum: '2026-06-27', link: null,                                                                                 größe: 'klein', besucher: null },
  { name: 'Lorient Pride',                   ort: 'Lorient',                 datum: '2026-06-27', link: null,                                                                                 größe: 'klein', besucher: null },
  { name: 'Lyon Pride',                      ort: 'Lyon',                    datum: '2026-06-27', link: 'https://www.instagram.com/cfl.lyon/',                                                größe: 'groß',  besucher: { anzahl: 14000, jahr: 2025 } },
  { name: 'Nîmes Pride',                     ort: 'Nîmes',                   datum: '2026-06-27', link: null,                                                                                 größe: 'mittel', besucher: null },
  { name: 'Paris Pride',                     ort: 'Paris',                   datum: '2026-06-27', link: 'https://www.inter-lgbt.org/',                                                        größe: 'groß',  besucher: { anzahl: 500000, jahr: 2025 } },
  { name: 'Sallanches Pride',                ort: 'Sallanches',              datum: '2026-06-27', link: null,                                                                                 größe: 'klein', besucher: null },
  { name: 'Tourcoing Pride',                 ort: 'Tourcoing',               datum: '2026-06-27', link: null,                                                                                 größe: 'mittel', besucher: null },
  { name: 'Cluny Pride',                     ort: 'Cluny',                   datum: '2026-07-04', link: null,                                                                                 größe: 'klein', besucher: null },
  { name: 'Le Mans Pride',                   ort: 'Le Mans',                 datum: '2026-07-04', link: null,                                                                                 größe: 'mittel', besucher: null },
  { name: 'Marseille Pride',                 ort: 'Marseille',               datum: '2026-07-04', link: 'https://www.pride-marseille.com/',                                                   größe: 'groß',  besucher: { anzahl: 40000, jahr: 2025 } },
  { name: 'Quimper Pride',                   ort: 'Quimper',                 datum: '2026-07-04', link: null,                                                                                 größe: 'klein', besucher: null },
  { name: 'Roanne Pride',                    ort: 'Roanne',                  datum: '2026-07-04', link: null,                                                                                 größe: 'klein', besucher: null },
  { name: 'Lyon Pride (Centre LGBTI+)',      ort: 'Lyon',                    datum: '2026-07-11', link: 'https://www.centrelgbti-lyon.org/',                                                  größe: 'groß',  besucher: null },
  { name: 'Nice Pride',                      ort: 'Nizza',                   datum: '2026-07-11', link: 'https://www.instagram.com/pinkparadnice/',                                           größe: 'groß',  besucher: null },
  { name: 'Annecy Pride',                    ort: 'Annecy',                  datum: '2026-07-18', link: 'https://www.helloasso.com/associations/annecypride',                                 größe: 'mittel', besucher: { anzahl: 1300, jahr: 2025 } },
  { name: 'Chenevelles Pride',               ort: 'Chenevelles',             datum: '2026-07-25', link: null,                                                                                 größe: 'klein', besucher: null },
  { name: 'Pontrieux Pride',                 ort: 'Pontrieux',               datum: '2026-07-26', link: null,                                                                                 größe: 'klein', besucher: null },
  { name: 'Clisson Pride',                   ort: 'Clisson',                 datum: '2026-09-12', link: null,                                                                                 größe: 'klein', besucher: null },
  { name: 'Chambéry Pride',                  ort: 'Chambéry',                datum: '2026-10-10', link: 'https://www.chambery.fr/',                                                           größe: 'mittel', besucher: { anzahl: 1000, jahr: 2024 } },
]

let added = 0, updated = 0, attUpdated = 0

for (const entry of franceData) {
  const city = CITY_STORED[entry.ort] ?? entry.ort
  const date = entry.datum
  const url  = entry.link
  const ig   = isIg(url) ? url : null
  const web  = isIg(url) ? null : url

  const existing = parades.find(p => p.city === city && p.date === date)

  if (existing) {
    if (ig  && !existing.instagram) { existing.instagram = ig;  updated++ }
    if (web && !existing.website)   { existing.website  = web;  updated++ }
  } else {
    const coords = COORDS[city]
    if (!coords) { console.warn(`⚠ No coords for "${city}" — skipped`); continue }

    parades.push({
      id:         makeId(entry.name, date),
      name:       entry.name,
      city,
      country:    'FR',
      lat:        coords[0],
      lon:        coords[1],
      date,
      size:       SIZE[entry.größe] ?? 'small',
      firstYear:  null,
      queerIndex: 59,
      languages:  null,
      website:    web,
      instagram:  ig,
      venues:     null,
    })
    added++
  }

  if (entry.besucher) {
    const { anzahl, jahr } = entry.besucher
    const idx = attendance.findIndex(a => a.city === city)
    if (idx === -1) {
      attendance.push({ city, bucket: anzahl, year: jahr })
      attUpdated++
    } else if (jahr >= attendance[idx].year) {
      attendance[idx] = { city, bucket: anzahl, year: jahr }
      attUpdated++
    }
  }
}

parades.sort((a, b) => a.date.localeCompare(b.date))

writeFileSync(PARADES_PATH,    JSON.stringify(parades, null, 2), 'utf8')
writeFileSync(ATTENDANCE_PATH, JSON.stringify(attendance, null, 2), 'utf8')

console.log(`✓ Added ${added} new parades, updated ${updated} existing entries, ${attUpdated} attendance records`)
