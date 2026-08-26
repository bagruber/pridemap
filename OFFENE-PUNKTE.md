# Offene Punkte

*Notiert am 26.08.2026 fuer spaetere Sitzungen. Erledigte Punkte bitte streichen,
nicht abhaken — die Datei soll kurz bleiben.*


## Toolchain-Stand

Dieses Repo laeuft seit dem 26.08.2026 auf **pnpm** (nicht npm) und auf der
projektweiten Hausbasis:

| Paket | Version |
|---|---|
| typescript | ~7.0.2 |
| @types/node | ^26.3.0 |
| vite | ^8.2.2 |
| @vitejs/plugin-react | ^6.1.0 |
| react / react-dom | 19.2.8 |

Der Sinn ist Deduplizierung: alle Repos teilen sich einen pnpm-Store, der genau so
weit dedupliziert, wie die Versionen uebereinstimmen. Gemessen kostet ein Repo mit
abweichenden Versionen ~158 MB, ein Versions-Zwilling ~8 MB. **Einzelne Pakete
also nicht im Alleingang hochziehen** — das faellt allen anderen Repos zur Last.

## Scripts rufen intern `pnpm run` auf

`build`, `build:colorful`, `deploy`, `build:hostinger` und `deploy:hostinger`
verketten interne Schritte (`pnpm run logo`, `pnpm run og`). Bis zum 26.08.2026
stand dort `npm run` — ein Rest aus der Zeit vor pnpm. Beim Bearbeiten der
Scripts bitte bei `pnpm run` bleiben.

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

## Nichts davon ist gepusht

Alle Aenderungen vom 26.08.2026 liegen als lokale Commits. Dieses Repo hat
keinen CI-Workflow, es gibt also nichts, was beim Push umschalten koennte — die
Commits liegen aber trotzdem nur lokal. Deployed wird hier von Hand ueber
`pnpm run deploy` (gh-pages) bzw. `deploy:hostinger`.

## Beim naechsten Paket-Update

Weder `pnpm install` noch `pnpm prune` raeumt die alte Version aus
`node_modules/.pnpm`. Nach einem Upgrade deshalb:

```bash
rm -rf node_modules && pnpm install
pnpm store prune
```

Ohne diesen Schritt bleibt der Speichergewinn auf dem Papier. In den beiden
Upgrade-Wellen am 26.08.2026 hat das zusammen ~1,2 GB freigegeben.
