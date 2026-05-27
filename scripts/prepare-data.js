/**
 * Run once: node scripts/prepare-data.js
 * Reads raw JSON + CSV, geocodes cities via Nominatim, writes src/data/parades.json
 * Nominatim ToS: 1 req/sec max, user-agent required.
 */
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

// ── Country name → ISO 2 ──────────────────────────────────────────────────────
const COUNTRY_MAP = {
  'Deutschland': 'DE', 'Österreich': 'AT', 'Schweiz': 'CH', 'Spanien': 'ES',
  'Frankreich': 'FR', 'Italien': 'IT', 'England': 'GB', 'Schottland': 'GB',
  'Wales': 'GB', 'Nordirland': 'GB', 'Niederlande': 'NL', 'Belgien': 'BE',
  'Polen': 'PL', 'Schweden': 'SE', 'Norwegen': 'NO', 'Dänemark': 'DK',
  'Finnland': 'FI', 'Irland': 'IE', 'Portugal': 'PT', 'Ungarn': 'HU',
  'Tschechien': 'CZ', 'Slowakei': 'SK', 'Slowenien': 'SI', 'Kroatien': 'HR',
  'Bosnien und Herzegowina': 'BA', 'Serbien': 'RS', 'Rumänien': 'RO',
  'Bulgarien': 'BG', 'Griechenland': 'GR', 'Litauen': 'LT', 'Lettland': 'LV',
  'Estland': 'EE', 'Albanien': 'AL', 'Nordmazedonien': 'MK', 'Montenegro': 'ME',
  'Moldawien': 'MD', 'Luxemburg': 'LU', 'Malta': 'MT', 'Zypern': 'CY',
  'Island': 'IS', 'Kosovo': 'XK', 'Ukraine': 'UA', 'Russland': 'RU',
  'Türkei': 'TR', 'Georgien': 'GE', 'Armenien': 'AM', 'Aserbaidschan': 'AZ',
  'Weißrussland': 'BY', 'Belarus': 'BY', 'Guernsey': 'GG', 'Liechtenstein': 'LI',
  'Andorra': 'AD', 'Monaco': 'MC', 'San Marino': 'SM',
}

// ── Size mapping ──────────────────────────────────────────────────────────────
const SIZE_MAP = { 'klein': 'small', 'mittel': 'medium', 'groß': 'large', 'riesig': 'large' }

// ── Hardcoded coordinates (saves API calls) ───────────────────────────────────
const KNOWN_COORDS = {
  // Germany - major cities
  'Berlin': [52.52, 13.405], 'Hamburg': [53.55, 10.0], 'München': [48.137, 11.576],
  'Köln': [50.938, 6.96], 'Frankfurt am Main': [50.11, 8.682], 'Stuttgart': [48.775, 9.18],
  'Düsseldorf': [51.225, 6.776], 'Leipzig': [51.34, 12.374], 'Dresden': [51.05, 13.738],
  'Hannover': [52.374, 9.738], 'Nürnberg': [49.452, 11.078], 'Bremen': [53.075, 8.808],
  'Dortmund': [51.514, 7.466], 'Essen': [51.455, 7.011], 'Duisburg': [51.432, 6.762],
  'Bochum': [51.481, 7.216], 'Wuppertal': [51.256, 7.149], 'Bielefeld': [52.02, 8.532],
  'Bonn': [50.734, 7.098], 'Münster': [51.962, 7.626], 'Karlsruhe': [49.006, 8.404],
  'Mannheim': [49.487, 8.466], 'Augsburg': [48.366, 10.898], 'Wiesbaden': [50.078, 8.24],
  'Gelsenkirchen': [51.508, 7.1], 'Mönchengladbach': [51.196, 6.435],
  'Braunschweig': [52.269, 10.522], 'Chemnitz': [50.832, 12.922],
  'Kiel': [54.323, 10.135], 'Aachen': [50.776, 6.083], 'Halle (Saale)': [51.482, 11.97],
  'Magdeburg': [52.131, 11.636], 'Freiburg im Breisgau': [47.996, 7.849],
  'Krefeld': [51.335, 6.556], 'Lübeck': [53.869, 10.686], 'Oberhausen': [51.47, 6.852],
  'Erfurt': [50.977, 11.029], 'Mainz': [49.999, 8.274], 'Rostock': [54.09, 12.099],
  'Kassel': [51.314, 9.495], 'Herne': [51.538, 7.225], 'Mülheim an der Ruhr': [51.427, 6.885],
  'Solingen': [51.166, 7.083], 'Osnabrück': [52.279, 8.047], 'Ludwigshafen am Rhein': [49.477, 8.445],
  'Leverkusen': [51.045, 6.984], 'Oldenburg': [53.143, 8.214], 'Neuss': [51.198, 6.687],
  'Heidelberg': [49.399, 8.675], 'Darmstadt': [49.872, 8.651], 'Paderborn': [51.719, 8.754],
  'Regensburg': [49.015, 12.1], 'Würzburg': [49.793, 9.93], 'Ingolstadt': [48.764, 11.424],
  'Wolfsburg': [52.423, 10.788], 'Göttingen': [51.534, 9.933], 'Recklinghausen': [51.614, 7.197],
  'Heilbronn': [49.14, 9.22], 'Ulm': [48.401, 9.993], 'Pforzheim': [48.893, 8.7],
  'Offenbach am Main': [50.1, 8.762], 'Bottrop': [51.524, 6.929], 'Trier': [49.754, 6.638],
  'Reutlingen': [48.492, 9.21], 'Koblenz': [50.357, 7.588], 'Bergisch Gladbach': [50.993, 7.126],
  'Erlangen': [49.598, 11.003], 'Moers': [51.453, 6.626], 'Siegen': [50.875, 8.024],
  'Saarbrücken': [49.234, 6.997], 'Hamm': [51.68, 7.822], 'Hagen': [51.358, 7.474],
  'Cottbus': [51.757, 14.333], 'Salzgitter': [52.153, 10.329], 'Hildesheim': [52.154, 9.957],
  'Jena': [50.927, 11.586], 'Gütersloh': [51.906, 8.384], 'Kaiserslautern': [49.444, 7.769],
  'Schwerin': [53.635, 11.401], 'Potsdam': [52.397, 13.059], 'Greifswald': [54.094, 13.388],
  'Bremerhaven': [53.55, 8.577], 'Flensburg': [54.794, 9.435], 'Lüneburg': [53.251, 10.41],
  'Koblenz': [50.357, 7.588], 'Tübingen': [48.521, 9.056], 'Fürth': [49.478, 10.989],
  'Gießen': [50.584, 8.678], 'Bayreuth': [49.945, 11.571], 'Bamberg': [49.899, 10.9],
  'Marburg': [50.802, 8.771], 'Hanau': [50.134, 8.916], 'Lüdenscheid': [51.219, 7.628],
  'Norderstedt': [53.696, 9.981], 'Gera': [50.877, 12.082], 'Kempten': [47.725, 10.315],
  'Ratingen': [51.297, 6.849], 'Velbert': [51.338, 7.045], 'Remscheid': [51.179, 7.193],
  'Weimar': [50.979, 11.328], 'Bocholt': [51.836, 6.617], 'Witten': [51.437, 7.353],
  'Zwickau': [50.72, 12.496], 'Rosenheim': [47.857, 12.129], 'Arnsberg': [51.395, 8.067],
  'Rüsselsheim': [49.996, 8.413], 'Kempten': [47.725, 10.315], 'Plauen': [50.496, 12.135],
  'Neubrandenburg': [53.558, 13.262], 'Frankfurt (Oder)': [52.348, 14.551],
  'Eisenhüttenstadt': [52.148, 14.665], 'Schwandorf': [49.327, 12.11],
  'Dessau-Rosslau': [51.832, 12.243], 'Angermünde': [53.019, 13.997],
  'Schwedt/Oder': [53.058, 14.278], 'Neustadt an der Orla': [50.737, 11.761],
  'Parchim': [53.426, 11.849], 'Eppelheim': [49.404, 8.628], 'Warendorf': [51.952, 7.993],
  'Stollberg': [50.711, 12.778], 'Euskirchen': [50.66, 6.788], 'Geilenkirchen': [50.966, 6.119],
  'Fritzlar': [51.133, 9.274], 'Wegberg': [51.143, 6.279], 'Celle': [52.624, 10.082],
  'Hameln': [52.104, 9.361], 'Bad Segeberg': [53.938, 10.309], 'Rheinsberg': [53.101, 12.876],
  'Storkow (Mark)': [52.264, 13.934], 'Witzenhausen': [51.338, 9.86], 'Hof (Saale)': [50.314, 11.917],
  'Wernigerode': [51.833, 10.784], 'Pirna': [50.96, 13.936], 'Bernau bei Berlin': [52.68, 13.589],
  'Müncheberg': [52.516, 14.124], 'Neuruppin': [52.924, 12.8], 'Neumünster': [54.074, 9.981],
  'Schwäbisch Hall': [49.113, 9.739], 'Wasserburg am Inn': [48.059, 12.23],
  'Kelheim': [48.916, 11.873], 'Ravensburg': [47.782, 9.612], 'Memmingen': [47.988, 10.182],
  'Köthen': [51.751, 11.971], 'Freiberg': [50.92, 13.342], 'Esslingen am Neckar': [48.741, 9.308],
  'Biberach an der Riß': [48.1, 9.785], 'Rheine': [52.285, 7.435], 'Unken': [47.636, 12.7],
  'Berlin (Marzahn)': [52.54, 13.56], 'Berlin (Reinickendorf)': [52.587, 13.345],
  'Landsberg am Lech': [48.047, 10.871], 'Weiden in der Oberpfalz': [49.676, 12.16],
  'Haltern am See': [51.742, 7.183], 'Bad Mergentheim': [49.492, 9.777],
  'Brandenburg an der Havel': [52.408, 12.558], 'Buchholz in der Nordheide': [53.33, 9.872],
  'Waldshut-Tiengen': [47.624, 8.215], 'Traunstein': [47.868, 12.644],
  'Soest': [51.569, 8.107], 'Siegburg': [50.797, 7.203], 'Wuppertal': [51.256, 7.149],
  'Würmtal': [48.1, 11.35], 'Nettetal': [51.321, 6.275], 'Hattingen': [51.403, 7.185],
  'Wesel': [51.659, 6.62], 'Freising': [48.403, 11.741], 'Detmold': [51.934, 8.882],
  'Gifhorn': [52.488, 10.545], 'Ronnenberg': [52.32, 9.665], 'Viersen': [51.255, 6.393],
  'Burgdorf': [52.447, 10.006], 'Bensheim': [49.681, 8.617], 'Friedberg': [50.335, 8.756],
  'Pfaffenhofen an der Ilm': [48.532, 11.506], 'Arnsberg': [51.395, 8.067],
  'Aurich': [53.472, 7.483], 'Brühl': [50.826, 6.9], 'Zwickau': [50.72, 12.496],
  'Fulda': [50.556, 9.676], 'Gotha': [50.949, 10.705], 'Groß-Gerau': [49.919, 8.483],
  'Ludwigsfelde': [52.303, 13.254], 'Rotenburg (Wümme)': [53.107, 9.41],
  'Königs Wusterhausen': [52.3, 13.633], 'Bad Oldesloe': [53.809, 10.376],
  'Regen': [48.971, 13.129], 'Aachen': [50.776, 6.083], 'Dortmund': [51.514, 7.466],
  'Bad Kreuznach': [49.847, 7.865], 'Goslar': [51.905, 10.428], 'Lahr/Schwarzwald': [48.34, 7.872],
  'Michelstadt': [49.677, 9.01], 'Albstadt': [48.213, 9.021], 'Luckenwalde': [52.085, 13.165],
  'Erlangen': [49.598, 11.003], 'Walsrode': [52.863, 9.584], 'Remscheid': [51.179, 7.193],
  'Oranienburg': [52.754, 13.238], 'Mosbach': [49.354, 9.148], 'Döbeln': [51.119, 13.113],
  'Bad Belzig': [52.14, 12.588], 'Delmenhorst': [53.05, 8.634], 'Hennigsdorf': [52.637, 13.205],
  'Jüterbog': [51.996, 13.073], 'Alfter': [50.746, 7.004], 'Wacken': [54.085, 9.403],
  'Landshut': [48.544, 12.152], 'Stendal': [52.606, 11.858], 'Görlitz': [51.154, 14.987],
  'Herzogenaurach': [49.572, 10.886], 'Emmendingen': [48.118, 7.85], 'Schorndorf': [48.805, 9.527],
  'Norden': [53.596, 7.206], 'Prenzlau': [53.317, 13.863], 'Northeim': [51.703, 9.999],
  'Mühldorf am Inn': [48.243, 12.522], 'Stockport': [53.406, -2.158],
  'Frankenberg (Eder)': [51.062, 8.796], 'Ebersberg': [48.077, 11.968],
  'Eberswalde': [52.836, 13.826], 'Miltenberg': [49.704, 9.265], 'Merseburg': [51.354, 11.993],
  'Herzberg am Harz': [51.685, 10.341], 'Murnau am Staffelsee': [47.679, 11.2],
  'Eggenfelden': [48.401, 12.764], 'Waren (Müritz)': [53.521, 12.673],
  'Neustrelitz': [53.359, 13.062], 'Eschwege': [51.185, 10.052], 'Minden': [52.289, 8.914],
  'Plauen': [50.496, 12.135], 'Leer': [53.228, 7.452], 'Berchtesgaden': [47.633, 13.001],
  'Peine': [52.32, 10.233], 'Olpe': [51.028, 7.852], 'Ilmenau': [50.683, 10.914],
  'Stralsund': [54.31, 13.09], 'Rosenheim': [47.857, 12.129], 'Neustadt an der Weinstraße': [49.352, 8.138],
  'Naumburg (Saale)': [51.149, 11.812], 'Riesa': [51.305, 13.296], 'Lüdenscheid': [51.219, 7.628],
  'Kaufbeuren': [47.881, 10.623], 'Zittau': [50.896, 14.806], 'Vechta': [52.726, 8.284],
  'Elmshorn': [53.754, 9.654], 'Rathenow': [52.607, 12.337], 'Nordhausen': [51.505, 10.793],
  'Husum': [54.474, 9.051], 'Aschaffenburg': [49.978, 9.147], 'Hofheim am Taunus': [50.088, 8.447],
  'Pinneberg': [53.655, 9.801], 'Oberhavel': [52.754, 13.238], 'Quickborn': [53.727, 9.907],
  'Meldorf': [54.093, 9.077], 'Rastatt': [48.858, 8.204], 'Ahrensburg': [53.675, 10.241],
  'Sangerhausen': [51.47, 11.301], 'Gummersbach': [51.027, 7.565], 'Offenburg': [48.472, 7.944],
  'Nürtingen': [48.627, 9.337], 'Erkrath': [51.223, 6.908], 'Bramsche': [52.399, 7.974],
  'Düren': [50.805, 6.492], 'Stade': [53.596, 9.476], 'Heide': [54.193, 9.098],
  'Marburg': [50.802, 8.771], 'Nordenham': [53.494, 8.474], 'Wiesbaden': [50.078, 8.24],
  'Torgau': [51.561, 13.004], 'Winsen (Luhe)': [53.358, 10.211], 'Schleswig': [54.518, 9.564],
  'Ahrensburg': [53.675, 10.241], 'Weimar': [50.979, 11.328], 'Herrenberg': [48.594, 8.874],
  'Lutherstadt Wittenberg': [51.866, 12.649], 'Karlsfeld': [48.222, 11.463],
  'Hohenlockstedt': [53.972, 9.661], 'Golßen': [51.994, 13.585], 'Jülich': [50.922, 6.362],

  // European capitals and major cities
  'Wien': [48.21, 16.37], 'Paris': [48.853, 2.35], 'London': [51.507, -0.128],
  'Amsterdam': [52.374, 4.898], 'Brussels': [50.85, 4.349], 'Brüssel': [50.85, 4.349],
  'Madrid': [40.416, -3.703], 'Barcelona': [41.387, 2.168], 'Rome': [41.902, 12.496],
  'Rom': [41.902, 12.496], 'Stockholm': [59.333, 18.065], 'Oslo': [59.913, 10.752],
  'Copenhagen': [55.676, 12.568], 'Kopenhagen': [55.676, 12.568], 'Helsinki': [60.17, 24.941],
  'Dublin': [53.333, -6.249], 'Lisbon': [38.717, -9.133], 'Lissabon': [38.717, -9.133],
  'Zurich': [47.376, 8.541], 'Zürich': [47.376, 8.541], 'Warsaw': [52.23, 21.01],
  'Warschau': [52.23, 21.01], 'Prague': [50.088, 14.421], 'Prag': [50.088, 14.421],
  'Budapest': [47.498, 19.04], 'Vienna': [48.21, 16.37], 'Athens': [37.976, 23.735],
  'Athen': [37.976, 23.735], 'Sofia': [42.698, 23.322], 'Bucharest': [44.432, 26.106],
  'Bukarest': [44.432, 26.106], 'Zagreb': [45.813, 15.978], 'Ljubljana': [46.057, 14.505],
  'Tallinn': [59.437, 24.754], 'Riga': [56.946, 24.106], 'Vilnius': [54.687, 25.28],
  'Bratislava': [48.148, 17.107], 'Belgrade': [44.802, 20.466], 'Belgrad': [44.802, 20.466],
  'Sarajevo': [43.848, 18.356], 'Chisinau': [47.005, 28.858], 'Chişinău': [47.005, 28.858],
  'Kyiv': [50.45, 30.524], 'Kiew': [50.45, 30.524], 'Reykjavik': [64.135, -21.895],
  'Tirana': [41.327, 19.82], 'Skopje': [41.997, 21.425], 'Valletta': [35.9, 14.514],
  'Andorra la Vella': [42.506, 1.521], 'Vaduz': [47.141, 9.52], 'San Marino': [43.936, 12.445],
  'Nikosia': [35.166, 33.365],

  // UK cities
  'Edinburgh': [55.953, -3.188], 'Glasgow': [55.864, -4.252], 'Manchester': [53.48, -2.242],
  'Birmingham': [52.486, -1.888], 'Liverpool': [53.41, -2.978], 'Leeds': [53.8, -1.549],
  'Bristol': [51.455, -2.595], 'Brighton': [50.827, -0.141], 'Sheffield': [53.381, -1.47],
  'Cardiff': [51.481, -3.18], 'Belfast': [54.597, -5.93], 'Newcastle upon Tyne': [54.978, -1.618],
  'Nottingham': [52.954, -1.158], 'Leicester': [52.637, -1.133], 'Southampton': [50.9, -1.404],
  'Oxford': [51.752, -1.258], 'Cambridge': [52.204, 0.121], 'Portsmouth': [50.8, -1.091],
  'Bath': [51.379, -2.362], 'York': [53.96, -1.087], 'Exeter': [50.726, -3.527],
  'Norwich': [52.628, 1.298], 'Plymouth': [50.375, -4.143], 'Hull': [53.745, -0.333],
  'Coventry': [52.408, -1.508], 'Bradford': [53.793, -1.752], 'Wolverhampton': [52.588, -2.13],
  'Swansea': [51.624, -3.944], 'Blackpool': [53.817, -3.036], 'Walsall': [52.586, -1.983],
  'Derby': [52.921, -1.476], 'Durham': [54.777, -1.574], 'Sunderland': [54.906, -1.381],
  'Gloucester': [51.865, -2.244], 'Chelmsford': [51.736, 0.47], 'Northampton': [52.24, -0.903],
  'Doncaster': [53.523, -1.129], 'Stoke-on-Trent': [52.999, -2.181], 'Lincoln': [53.234, -0.538],
  'Reading': [51.454, -0.972], 'Swindon': [51.558, -1.779], 'Salford': [53.484, -2.291],
  'Lancaster': [54.048, -2.799], 'Chester': [53.19, -2.89], 'Wakefield': [53.683, -1.505],
  'Eastbourne': [50.77, 0.28], 'Macclesfield': [53.258, -2.124], 'Worthing': [50.818, -0.372],
  'Stockport': [53.406, -2.158], 'Witney': [51.785, -1.485], 'Torquay': [50.463, -3.525],
  'Croydon': [51.374, -0.099], 'Ryde': [50.73, -1.162], 'Folkestone': [51.079, 1.176],
  'Congleton': [53.16, -2.216], 'Hebden Bridge': [53.741, -2.01], 'Ely': [52.397, 0.263],
  'Margate': [51.389, 1.384], 'Newquay': [50.413, -5.075], 'Bath': [51.379, -2.362],
  'Hertford': [51.796, -0.079], 'Royal Leamington Spa': [52.289, -1.536],
  'Canterbury': [51.28, 1.083], 'Chesterfield': [53.235, -1.421], 'Bourne': [52.77, -0.378],
  'Silloth': [54.872, -3.388], 'Great Malvern': [52.115, -2.318], 'Salisbury': [51.07, -1.794],
  'Eastleigh': [50.972, -1.349], 'Derry': [55.006, -7.32], 'Newry': [54.175, -6.34],
  'Saltash': [50.407, -4.214], 'Livingston': [55.883, -3.523], 'Kirkcaldy': [56.113, -3.162],
  'Shetland-Inseln': [60.154, -1.149],

  // Irish cities
  'Cork': [51.898, -8.474], 'Limerick': [52.668, -8.63], 'Drogheda': [53.718, -6.348],
  'Castlebar': [53.855, -9.299],

  // Swedish cities
  'Göteborg': [57.707, 11.967], 'Malmö': [55.605, 13.0], 'Uppsala': [59.858, 17.645],
  'Linköping': [58.411, 15.621], 'Örebro': [59.274, 15.21], 'Västerås': [59.609, 16.544],
  'Norrköping': [58.587, 16.179], 'Helsingborg': [56.047, 12.694], 'Jönköping': [57.781, 14.157],
  'Umeå': [63.826, 20.263], 'Lund': [55.703, 13.191], 'Borås': [57.721, 12.94],
  'Sundsvall': [62.392, 17.308], 'Gävle': [60.676, 17.14], 'Eskilstuna': [59.369, 16.509],
  'Södertälje': [59.195, 17.626], 'Karlstad': [59.378, 13.503], 'Växjö': [56.878, 14.809],
  'Trollhättan': [58.284, 12.289], 'Kristianstad': [56.031, 14.154],
  'Söderhamn': [61.302, 17.064], 'Östersund': [63.179, 14.636], 'Norrtälje': [59.758, 18.705],
  'Katrineholm': [59.0, 16.204], 'Falun': [60.606, 15.633], 'Boden': [65.824, 21.688],

  // Norwegian cities
  'Bergen': [60.392, 5.324], 'Trondheim': [63.43, 10.395], 'Stavanger': [58.97, 5.733],
  'Tromsø': [69.649, 18.956], 'Kristiansand': [58.147, 7.996],

  // Danish cities
  'Aarhus': [56.162, 10.21], 'Odense': [55.396, 10.389], 'Aalborg': [57.046, 9.921],
  'Esbjerg': [55.476, 8.46], 'Tórshavn': [62.009, -6.771],

  // Finnish cities
  'Tampere': [61.498, 23.761], 'Turku': [60.451, 22.267], 'Oulu': [65.013, 25.472],
  'Lahti': [60.983, 25.655], 'Joensuu': [62.601, 29.763],

  // Spanish cities
  'Sevilla': [37.389, -5.984], 'Valencia': [39.47, -0.377], 'Bilbao': [43.263, -2.935],
  'Málaga': [36.72, -4.42], 'Zaragoza': [41.656, -0.877], 'Murcia': [37.984, -1.13],
  'Alicante': [38.345, -0.482], 'Las Palmas de Gran Canaria': [28.124, -15.432],
  'Maspalomas': [27.76, -15.586], 'Palma de Mallorca': [39.569, 2.65],
  'Gijón': [43.545, -5.662], 'Córdoba': [37.888, -4.779], 'Torremolinos': [36.621, -4.5],
  'Ibiza-Stadt': [38.907, 1.433], 'Sitges': [41.236, 1.808], 'Benidorm': [38.535, -0.133],
  'Torremolinos': [36.621, -4.5], 'Zaragoza': [41.656, -0.877],
  'Santa Cruz de Tenerife': [28.466, -16.252],

  // French cities
  'Lyon': [45.75, 4.847], 'Marseille': [43.296, 5.381], 'Toulouse': [43.604, 1.444],
  'Nice': [43.71, 7.262], 'Nantes': [47.218, -1.554], 'Straßburg': [48.574, 7.751],
  'Montpellier': [43.611, 3.877], 'Bordeaux': [44.836, -0.581], 'Rennes': [48.117, -1.678],
  'Lille': [50.637, 3.063], 'Rouen': [49.443, 1.1], 'Grenoble': [45.188, 5.724],
  'Nancy': [48.693, 6.185], 'Biarritz': [43.483, -1.559], 'Angers': [47.473, -0.563],
  'Orléans': [47.903, 1.904], 'Poitiers': [46.58, 0.34], 'Le Mans': [48.008, 0.199],
  'Arras': [50.291, 2.78],

  // Italian cities
  'Milan': [45.465, 9.189], 'Mailand': [45.465, 9.189], 'Naples': [40.852, 14.268],
  'Neapel': [40.852, 14.268], 'Turin': [45.07, 7.686], 'Genua': [44.407, 8.934],
  'Palermo': [38.116, 13.362], 'Bologna': [44.494, 11.342], 'Florence': [43.77, 11.248],
  'Venice': [45.435, 12.336], 'Bergamo': [45.695, 9.67], 'Pavia': [45.185, 9.157],
  'Cremona': [45.133, 10.023], 'Varese': [45.821, 8.825], 'Salerno': [40.681, 14.765],
  'Rimini': [44.059, 12.565], 'Catania': [37.507, 15.083], 'Lecce': [40.353, 18.174],
  'Gallipoli': [40.055, 17.992], 'Pompeji': [40.75, 14.497], 'Syrakus': [37.065, 15.287],
  'Campobasso': [41.561, 14.657], 'Arco': [45.92, 10.883],

  // Dutch/Belgian cities
  'Rotterdam': [51.924, 4.478], 'The Hague': [52.073, 4.314], 'Utrecht': [52.092, 5.104],
  'Antwerpen': [51.221, 4.399], 'Ghent': [51.054, 3.718], 'Bruges': [51.209, 3.224],
  'Maastricht': [50.851, 5.692], 'Tilburg': [51.559, 5.091], 'Gouda': [52.017, 4.707],
  'Alkmaar': [52.631, 4.745], 'Namur': [50.465, 4.867],

  // Swiss cities
  'Bern': [46.948, 7.448], 'Basel': [47.559, 7.588], 'Geneva': [46.205, 6.143],
  'Lausanne': [46.522, 6.633], 'Lugano': [46.005, 8.952],

  // Austrian cities
  'Graz': [47.07, 15.439], 'Linz': [48.306, 14.286], 'Salzburg': [47.8, 13.045],
  'Innsbruck': [47.269, 11.394], 'Klagenfurt': [46.624, 14.308], 'Bregenz': [47.503, 9.748],
  'Villach': [46.612, 13.851], 'St. Pölten': [48.204, 15.624], 'Steyr': [48.042, 14.421],
  'Mistelbach': [48.573, 16.573], 'Spittal an der Drau': [46.8, 13.496],
  'Deutschlandsberg': [46.814, 15.22], 'Neustift im Stubaital': [47.114, 11.315],
  'Mittersill': [47.283, 12.476], 'Bad Ischl': [47.714, 13.624], 'Unken': [47.636, 12.7],
  'Kufstein': [47.581, 12.168], 'St. Johann im Pongau': [47.352, 13.2],

  // Polish cities
  'Krakau': [50.061, 19.938], 'Wrocław': [51.107, 17.039], 'Poznan': [52.41, 16.925],
  'Poznań': [52.41, 16.925], 'Gdańsk': [54.352, 18.646], 'Danzig': [54.352, 18.646],
  'Katowice': [50.264, 19.024],

  // Nordic/Baltic
  'Esch-sur-Alzette': [49.495, 5.979], 'Luxemburg-Stadt': [49.611, 6.131],
  'Sankt Vith': [50.282, 6.134],

  // Other
  'Tórshavn': [62.009, -6.771], 'St. Peter Port': [49.456, -2.536],
}

// ── Parse rainbow index CSV ────────────────────────────────────────────────────
function parseCSVLine(line) {
  const fields = []
  let cur = '', inQ = false
  for (const ch of line) {
    if (ch === '"') { inQ = !inQ }
    else if (ch === ',' && !inQ) { fields.push(cur); cur = '' }
    else cur += ch
  }
  fields.push(cur)
  return fields
}

function parseRainbowCSV(csvPath) {
  const text = readFileSync(csvPath, 'utf8')
  const lines = text.split('\n').filter(l => l.trim())
  const result = {}
  for (let i = 3; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i])
    const code = cols[0]?.trim()
    const scoreRaw = cols[2]?.trim().replace(',', '.')
    if (code && scoreRaw) {
      const score = parseFloat(scoreRaw)
      if (!isNaN(score)) result[code] = Math.round(score)
    }
  }
  return result
}

// ── Geocode via Nominatim ─────────────────────────────────────────────────────
async function geocode(city, countryCode) {
  const key = city
  if (KNOWN_COORDS[key]) return KNOWN_COORDS[key]

  const q = encodeURIComponent(`${city}, ${countryCode}`)
  const url = `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1&countrycodes=${countryCode.toLowerCase()}`
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'PrideMap/1.0 (benedict.gruber@gmail.com)' }
    })
    const data = await res.json()
    if (data[0]) {
      const lat = parseFloat(data[0].lat)
      const lon = parseFloat(data[0].lon)
      KNOWN_COORDS[key] = [lat, lon]
      return [lat, lon]
    }
  } catch (e) {
    console.error(`Geocoding failed for ${city}: ${e.message}`)
  }
  return null
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[äöüß]/g, c => ({ ä:'ae', ö:'oe', ü:'ue', ß:'ss' })[c] ?? c)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const rawPath = join(ROOT, 'data', 'deepseek_json_20260527_54ef41_pride.json')
  const csvPath = join(ROOT, 'data', 'rainbow-map-2026.csv')
  const outPath = join(ROOT, 'src', 'data', 'parades.json')

  const raw = JSON.parse(readFileSync(rawPath, 'utf8'))
  const queerIndex = parseRainbowCSV(csvPath)

  console.log(`Processing ${raw.length} parades...`)

  // Collect unique city+country pairs to minimise geocoding calls
  const uniqueCities = new Map()
  for (const p of raw) {
    const country = COUNTRY_MAP[p.land]
    if (!country) { console.warn(`Unknown country: ${p.land}`); continue }
    const key = `${p.ort}|${country}`
    if (!uniqueCities.has(key)) uniqueCities.set(key, { city: p.ort, country })
  }

  console.log(`Geocoding ${uniqueCities.size} unique city/country pairs...`)
  const coords = new Map()
  let n = 0
  for (const [key, { city, country }] of uniqueCities) {
    const c = await geocode(city, country)
    coords.set(key, c)
    n++
    if (n % 10 === 0) console.log(`  ${n}/${uniqueCities.size}`)
    // Nominatim rate limit: 1 req/sec. Hardcoded cities skip the sleep.
    if (!KNOWN_COORDS[city]) await sleep(1100)
  }

  const seen = new Set()
  const parades = []

  for (const p of raw) {
    const country = COUNTRY_MAP[p.land]
    if (!country) continue

    const size = SIZE_MAP[p.größe] ?? 'small'
    const key = `${p.ort}|${country}`
    const coord = coords.get(key)

    // Deduplicate by name+date (same event listed twice)
    const dedupKey = `${p.name}|${p.datum}`
    if (seen.has(dedupKey)) continue
    seen.add(dedupKey)

    const id = slugify(`${p.name} ${p.datum}`)

    parades.push({
      id,
      name: p.name,
      city: p.ort,
      country,
      lat: coord ? coord[0] : null,
      lon: coord ? coord[1] : null,
      date: p.datum,
      size,
      firstYear: null,
      queerIndex: queerIndex[country] ?? null,
      languages: null,
      website: null,
      venues: null,
    })
  }

  writeFileSync(outPath, JSON.stringify(parades, null, 2))
  console.log(`\nDone. Wrote ${parades.length} parades to src/data/parades.json`)
  const missing = parades.filter(p => p.lat === null).length
  if (missing > 0) console.log(`  ${missing} parades missing coordinates (will be hidden on map)`)
}

main().catch(console.error)
