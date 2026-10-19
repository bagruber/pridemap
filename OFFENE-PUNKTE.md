# Offene Punkte

*Notiert am 26.08.2026 fuer spaetere Sitzungen. Erledigte Punkte bitte streichen,
nicht abhaken — die Datei soll kurz bleiben.*


## Toolchain-Stand

Dieses Repo laeuft seit dem 26.08.2026 auf **pnpm** (nicht npm) und auf der
projektweiten Hausbasis. **Die Zielversionen stehen nicht hier**, sondern in
`hausbasis/baseline.json` — eine Quelle statt einer Tabelle je Repo. Abgleich:

```bash
node ../hausbasis/check.mjs --kurz
```

Der Sinn ist Deduplizierung: alle Repos teilen sich einen pnpm-Store, der genau so
weit dedupliziert, wie die Versionen uebereinstimmen. Gemessen kostet ein Repo mit
abweichenden Versionen ~158 MB, ein Versions-Zwilling ~8 MB. **Einzelne Pakete
also nicht im Alleingang hochziehen** — das faellt allen anderen Repos zur Last.

## Scripts rufen intern `pnpm run` auf

`build`, `build:colorful`, `deploy`, `build:hostinger` und `deploy:hostinger`
verketten interne Schritte (`pnpm run data`, `pnpm run logo`, `pnpm run og`).
Bis zum 26.08.2026 stand dort `npm run` — ein Rest aus der Zeit vor pnpm. Beim
Bearbeiten der Scripts bitte bei `pnpm run` bleiben.

## Laufzeitprobe statt nur Build

Dieses Repo ist reines JSX ohne TypeScript. Ein gruener Build sagt hier wenig,
weil der Bundler nichts typprueft — beim React-19-Umstieg wurde deshalb die
gebaute App real im Browser geladen und auf `console`-Fehler geprueft.

Rezept, falls wieder noetig:

```bash
pnpm run build
pnpm exec vite preview --port 4173 &
# Skript IM REPO ablegen, sonst findet es playwright-core nicht
```

Zwei Stolpersteine: `playwright-core` erwartet einen exakt passenden
Chromium-Build (der Cache unter `AppData/Local/ms-playwright` passte nicht) —
`chromium.launch({ channel: 'chrome' })` nutzt stattdessen das installierte
Google Chrome. Und `vite preview` antwortet auf `/` mit einem 302 auf
`/pridemap/`; die Probe muss die Ziel-URL laden.

## Share-Bilder brauchen WebGL und Geduld

`pnpm run og` zeichnet die Karte auf jeder Share-Karte seit dem 19.10.2026 mit
MapLibre statt mit Raster-Kacheln: CARTOs Raster-Basemap verlangt inzwischen
einen API-Key und liefert sonst eine Kachel mit "API KEY REQUIRED" — mit
HTTP 200, es schlaegt also nichts fehl, die Bilder kommen nur gestempelt
heraus.

Zwei Folgen davon:

- Der Renderer braucht dieselben Flags wie die Screenshot-Skripte
  (`--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader`), und
  er laeuft eins nach dem anderen. Vier parallele WebGL-Kontexte haben sich
  gegenseitig ausgehungert.
- Ein voller Lauf (639 Bilder) dauert rund 25 bis 30 Minuten. Das ist normal,
  nicht haengengeblieben. Im Alltag ist der Lauf inkrementell und betrifft nur
  neue oder verschobene Termine.

Sollte jemand doch einen CARTO-Key besorgen: der Raster-Weg war schneller, aber
das Vektor-Ergebnis ist schaerfer.

## Deployt wird von Hand

Dieses Repo hat keinen CI-Workflow. Gebaut und veroeffentlicht wird ueber
`pnpm run deploy` (GitHub-Pages-Spiegel, nur SPA) und `pnpm run deploy:hostinger`
(kanonische Seite mit statischen Seiten, Weiterleitungen und Share-Bildern).
Der Stand vom 19.10.2026 ist auf beiden Branches und auf `main`.

## Beim naechsten Paket-Update

Weder `pnpm install` noch `pnpm prune` raeumt die alte Version aus
`node_modules/.pnpm`. Nach einem Upgrade deshalb:

```bash
rm -rf node_modules && pnpm install
pnpm store prune
```

Ohne diesen Schritt bleibt der Speichergewinn auf dem Papier. In den beiden
Upgrade-Wellen am 26.08.2026 hat das zusammen ~1,2 GB freigegeben.

## Ab hier ist Datenpflege, nicht Code

Seit dem 19.10.2026 ist die Quelle der Wahrheit `data/prides/<cc>.json`, eine
Datei je Land. `src/data/prides.json` ist generiert und gitignored — wer das
Repo frisch klont, braucht einmal `pnpm install` und dann `pnpm run dev`, das
baut die Laufzeitfassung mit.

Der Jahreswechsel ist kein Code mehr: `season(today)` liefert ab dem 1. Oktober
das Folgejahr, und Titel, statische Seiten und `llms.txt` ziehen beim naechsten
Build nach. Im Oktober also einmal neu bauen und deployen.

Was jetzt zaehlt, steht in `PLAN-2027.md`, Abschnitt 5: Termine fuer 2027
recherchieren. 638 von 639 Prides haben noch keinen.

## Die Seite hat hier TypeScript behauptet

Dieses Repo ist reines JSX - das steht weiter oben schon, unter "Laufzeitprobe
statt nur Build", und war ausserhalb trotzdem als TypeScript gefuehrt. Seit
dem 30.08.2026 steht dort JavaScript.

## Haengt an gruber.am

Die Projektliste auf gruber.am liest **nichts** aus diesem Repo. Der Eintrag
wird von Hand in `gruberam/site/src/data/projects.ts` gepflegt und stand am
30.08.2026 so drin:

```ts
id: "pridemap"
stack: ["React", "JavaScript", "Vite", "MapLibre"]
```

Stand 19.10.2026 stimmt der Eintrag weiter: React 19, JavaScript, Vite 8,
MapLibre. Der Plan fuer 2027 aendert daran nichts.

Bis zum 30.08.2026 stand dort `["MapLibre", "React", "TypeScript"]` - es gibt keine typescript-Abhaengigkeit.

Wer hier die Sprache, das Framework oder die Datenbank wechselt, das Repo
umbenennt, archiviert oder privat schaltet, muss den Eintrag dort nachziehen.
Die Seite merkt es von allein nicht.

Alle Repos mit so einem Abschnitt finden:

```bash
grep -rl "Haengt an gruber.am" ~/Documents/GitHub/bagruber/*/OFFENE-PUNKTE.md
```
