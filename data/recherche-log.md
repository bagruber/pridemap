# Recherche-Log

Nur anhaengen, nie aendern. Je Sitzung: Datum, Land, abgearbeitete Quellen,
Bilanz (neu / geaendert / offen) und Spuren fuer spaeter.

---

## 2026-10-19 — Migration des Grunddatensatzes (keine Recherche)

Kein Land bearbeitet. Phase C aus PLAN-2027.md: die flache Eventliste wurde zu
`data/prides/<cc>.json`. Bilanz der Migration: 639 Prides, 639 Ausgaben 2026,
alle 639 Daten, alle 335 Websites, alle 189 Instagram-Links und alle 171
Besucherzahlen wiedergefunden, keine ID doppelt.

Alle Ausgaben 2026 stehen auf `unverified`. Der Grunddatensatz ist ein
DeepSeek-Export vom 27.05.2026 ohne Quell-URLs; was damals bestaetigt war, ist
nicht mehr nachvollziehbar.

**Regel fuer Stadtnamen** (am 19.10.2026 entschieden, gilt fuer jede weitere
Welle): `city` traegt den Namen in Landessprache, immer in lateinischer
Schrift — er landet in der ID, im Dateinamen und im Pfad. Die native
Schreibung anderer Alphabete kommt nach `aka`, damit die Suche sie trotzdem
versteht (`ua-kyiv`: city "Kyiv", aka "Kиїв", cityNames.de "Kiew"). Deutsche
und englische Form stehen in `cityNames`, aber nur, wenn sie abweichen.

**Spuren fuer spaeter:**

- `gb-bradford` hat eine Besucherzahl (10.000) ohne Jahr.
- `de-papenburg` hatte keine Koordinaten. Am 19.10.2026 ueber Nominatim
  ergaenzt (53.077 / 7.411, Landkreis Emsland).
- `dk-torshavn` liegt auf den Faeroern, steht aber unter DK. Die Faeroer haben
  einen eigenen ISO-Code (FO) und keinen eigenen ILGA-Indexwert.
- Regionen stehen teils auf Deutsch, auch ausserhalb des deutschen
  Sprachraums (`ua-kyiv`: "Oblast Kiew"). Bereinigung gehoert in die
  jeweilige Landeswelle.
- 207 Prides haben weder Website noch Instagram, 171 Besucherzahlen haben
  kein `kind` und kein `quote`. Beides sind erwartete Warnungen des
  Validators, keine Fehler.

---

## 2026-10-19 — Erster Abgleich mit Uebersichtsseiten (keine Daten geaendert)

Neue Werkzeuge: `pnpm run data:abgleich <quelle>` (Quellen `csd-de`, `csd-europa`,
`uk-ie`), `pnpm run data:status` und `pnpm run data:links`. Je Quelle ein Abruf,
robots.txt geprueft. Die vollstaendigen Berichte liegen lokal unter
`data/abgleich/2026-10-19-*.md`, sie sind gitignored. Kein Land durchgesehen, `lastSweep`
bleibt leer, in `data/prides` wurde nichts geaendert.

| Quelle | Eintraege | neu | Termin 2027 fuer bekannte | weicht ab | unscharf | Neben-Events | schon so |
|---|---|---|---|---|---|---|---|
| csd-termine.de/deutschland | 323 | 40 | 26 | 9 | 4 | 0 | 244 |
| csd-termine.de/europa | 266 | 17 | 10 | 14 | 2 | 0 | 223 |
| gayprideshop.co.uk, Seite 2026 | 360 | 248 | – | 11 | 10 | 30 | 58 |

**Herkunft:** 467 unserer Termine 2026 stimmen exakt mit csd-termine.de ueberein, und
dort haben die Namen dasselbe Muster wie im Grunddatensatz („Tromso Pride 2026 / CSD
Tromso 2026“). Der DeepSeek-Export stammt also vermutlich zu grossen Teilen von dort.

**Spuren fuer die DE-Welle**

- Termine 2027 fuer bekannte CSDs, laut csd-termine.de, beim Veranstalter zu
  bestaetigen: de-angermunde 10.04., de-schwedt-oder 17.04., de-hannover 16.05.,
  de-norderstedt 22.05., de-witzenhausen 22.05., de-warendorf 23.05., de-dresden 29.05.,
  de-eschwege 29.05., de-karlsruhe 05.06., de-saarbrucken 06.06., de-pinneberg 12.06.,
  de-herne 19.06., de-neubrandenburg 19.06., de-rendsburg 19.06., de-julich 26.06.,
  de-koln 04.07., de-plauen 04.07., de-kiel 10.07., de-frankfurt-am-main 17.07.,
  de-berlin 24.07., de-stuttgart 24.07., de-bonn 24.07., de-hamburg 07.08.,
  de-lubeck 21.08., de-kaufbeuren 04.09., de-walsrode 25.09.
  Auffaellig weit vom Vorjahr: Eschwege (2026 im August), Plauen (2026 im August),
  Neubrandenburg (2026 im August).
- Neue CSDs mit Termin 2027: Templin 13.03., Burgstaedt 20.03., Niebuell 27.03.,
  Buehl 29.05., Cuxhaven 05.06., Freital 19.06., Iserlohn 27.06., Waltrop 10.07.
- **CSD Ansbach, 07.11.2026** fehlt bei uns und liegt noch in dieser Saison.
- **Northeim:** csd-termine.de nennt den 29.08.2026, bei uns steht der 07.11.2026, der
  derzeit einzige kommende Termin auf der Karte. Sieht nach einer Verwechslung mit
  Ansbach aus. Vor dem naechsten Deploy pruefen.
- 31 CSDs, die 2026 stattfanden und bei uns fehlen: Hueckelhoven (Kreis Heinsberg),
  Falkensee, Merzig, Bruchsal, Sonneberg, Tuttlingen, Bad Wildungen, Eichstaett,
  Lindenberg im Allgaeu, Ahaus, Korbach, Hann. Muenden, Uelzen, Wolfsburg, Bad Hersfeld,
  Hassberge, Hassfurt, Friedersdorf, Kulmbach, Altenburg, Kirchheimbolanden,
  Quakenbrueck, Schweinfurt, Eisenach (Thuer), Wismar, Nierstein, Offenbach, Gera,
  Strausberg, Verden, Fuerstenfeldbruck. Hassberge und Hassfurt koennten derselbe sein.
- 9 Termine 2026 weichen ab (Fuerth, Schongau, Berchtesgaden, Zwickau, Aachen, Northeim,
  Ilmenau, Bernau bei Berlin, Greifswald), Details im Bericht.

**Spuren Europa**

- Termine 2027 fuer bekannte Prides: gb-swansea 15.05., nl-alkmaar 22.05.,
  gb-birmingham 29.05., nl-utrecht 05.06., ch-zurich 12.06., lv-riga 17.06.,
  it-torino 26.06. (EuroPride 2027), at-innsbruck 31.07., gb-nottingham 31.07.,
  nl-amsterdam 07.08.
- Neu: Elche, „Zypern“ (gegen cy-nikosia pruefen), Manilva, Lillehammer,
  Weston-super-Mare, Bridlington, Newbury, Nottinghamshire, Mold, Bolton, Karlskrona,
  Alpbach, Tornio-Haparanda, Gravellona Toce, Neath, **Srem (24.10.2026)** und
  **Tromsoe (14.11.2026)**. Die letzten beiden liegen noch in dieser Saison.
- 14 Termine 2026 weichen ab. Darunter Paris: bei uns `rescheduled` auf den 03.10.,
  die Liste nennt weiter den 27.06. Pruefen.

**Spuren UK & Irland**

- Die Seite fuer 2027 gibt es noch nicht. Gegen 2026 haben 248 Eintraege kein
  Gegenstueck bei uns: Die Abdeckung von GB und IE ist die groesste Luecke im
  Datensatz (79 bei uns, ueber 270 laut Seite).
- 30 Neben-Events nach Namen, davon 25 Trans Prides. **Offene Frage an Benedict (E9):**
  Zaehlen Trans Prides als eigener Pride eines Ortes? Bisher sortiert das Werkzeug sie
  aus.
- 11 Termine 2026 weichen ab, darunter Brighton (31.07. statt 01.08.) und Liverpool
  (25.07. statt 01.08.).
- Websites aus der Liste fuer Prides ohne eine bei uns: gb-shetland-inseln
  shetlandpride.uk, gb-torquay torbaypride.co.uk, gb-silloth sillothpride.com,
  gb-macclesfield maccpride.org, gb-congleton congletonpride.co.uk, gb-hebden-bridge
  happyvalleypride.com, gb-livingston westlothianpride.org, gb-chester
  chesterpride.co.uk.

**Links:** siehe den folgenden Eintrag. 61 Websites im Datensatz zeigen auf Domains,
die es nicht gibt, vermutlich geratene Adressen aus dem Grunddatensatz (etwa
sevillapride.com, malagapride.es, steyrpride.at). In der App fuehren sie ins Leere.
In der jeweiligen Landeswelle entfernen oder ersetzen. `de-berlin` (csd-berlin.de)
antwortet mit 404, von Hand pruefen.

---

## 2026-10-19 — Link-Pruefung (data:links)

335 Websites geprueft: 206 ok, 36 umgezogen, 7 kaputt, 77 unerreichbar, 9 sperren Bots aus (kein Befund).

**Kaputt:**

- `be-bruxelles` https://www.brusselspride.eu/en — HTTP 404
- `de-berlin` https://csd-berlin.de/ — HTTP 404
- `de-minden` https://csd-minden.de — HTTP 404
- `es-alicante` https://alicantepride.com — HTTP 500
- `es-benidorm` https://benidormpride.com — HTTP 404
- `fr-agen` https://www.agen.fr/en-ce-moment/agenda/evenement/4-eme-marche-des-fiertes-du-lot-et-garonne — HTTP 404
- `gb-lancaster` https://lancasterpride.org — HTTP 526

**Unerreichbar:**

- `at-kufstein` https://www.perlenpride.at — TimeoutError
- `at-steyr` https://www.steyrpride.at — ENOTFOUND
- `ba-sarajevo` https://sarajevopride.ba — ENOTFOUND
- `be-sankt-vith` https://stvithpride.be — ENOTFOUND
- `ch-lugano` https://www.pride2018.ch — ECONNRESET
- `de-duisburg` https://csd-duisburg.de — ERR_SSL_TLSV1_UNRECOGNIZED_NAME
- `de-frankenberg-eder` https://csd-frankenberg.de — ERR_TLS_CERT_ALTNAME_INVALID
- `de-schwabach` https://csd-schwabach.de — TimeoutError
- `es-bilbao` https://bilbaopride.org — ENOTFOUND
- `es-cordoba` https://www.cordobapride.es — ENOTFOUND
- `es-eivissa` https://www.ibizapride.com — TimeoutError
- `es-gijon` https://gijonpride.com — ENOTFOUND
- `es-malaga` https://malagapride.es — ENOTFOUND
- `es-murcia` https://murciaorgullosa.es — ENOTFOUND
- `es-palma-de-mallorca` https://www.palmapride.es — ENOTFOUND
- `es-sevilla` https://sevillapride.com — ENOTFOUND
- `es-zaragoza` https://zaragozapride.es — ENOTFOUND
- `fi-helsinki` https://helsinkipride.fi — CERT_HAS_EXPIRED
- `fi-tampere` https://tampereenpride.fi — ENOTFOUND
- `fr-arras` https://www.arraspride.fr — ENOTFOUND
- `fr-le-mans` https://www.lemanspride.fr — ENOTFOUND
- `fr-marseille` https://www.marseillepride.fr — ENOTFOUND
- `fr-montpellier` https://montpellier-pride.com — ENOTFOUND
- `fr-nantes` https://www.nantespride.com — ENOTFOUND
- `fr-poitiers` https://www.gaypride.fr — ECONNRESET
- `fr-rennes` https://www.iskis-rbx.fr/ — ENOTFOUND
- `fr-rouen` https://www.rouenpride.fr — ENOTFOUND
- `fr-strasbourg` https://www.marche-des-fiertes-strasbourg.fr — ENOTFOUND
- `gb-bath` https://bathpride.co.uk — ENOTFOUND
- `gb-belfast` https://belfastpride.org.uk — ENOTFOUND
- `gb-blackpool` https://www.prideblackpool.co.uk — ERR_TLS_CERT_ALTNAME_INVALID
- `gb-bradford` https://www.bradfordpride.org.uk — ENOTFOUND
- `gb-cardiff` https://www.cardiffpride.co.uk — ENOTFOUND
- `gb-chelmsford` https://chelmsfordpride.co.uk — ENOTFOUND
- `gb-derry` https://derrypride.org.uk — ENOTFOUND
- `gb-doncaster` https://doncasterpride.org.uk — ENOTFOUND
- `gb-edinburgh` https://www.edinburghpride.org.uk — ENOTFOUND
- `gb-glasgow` https://glasgowpride.org.uk — ENOTFOUND
- `gb-gloucester` https://gloucesterpride.org.uk — ENOTFOUND
- `gb-hull` https://hullpride.co.uk — ENOTFOUND
- `gb-kirkcaldy` https://kirkcaldypride.com — ENOTFOUND
- `gb-leicester` https://leicesterpride.org.uk — ENOTFOUND
- `gb-newcastle-upon-tyne` https://newcastlepride.org.uk — ENOTFOUND
- `gb-newquay` https://newquaypride.co.uk — ENOTFOUND
- `gb-newry` https://newrypride.com — ENOTFOUND
- `gb-northampton` https://northamptonpride.com — ENOTFOUND
- `gb-nottingham` https://nottinghampride.co.uk — ENOTFOUND
- `gb-plymouth` https://plymouthpride.org.uk — ENOTFOUND
- `gb-portsmouth` https://www.portsmouthpride.org.uk/ — ENOTFOUND
- `gb-royal-leamington-spa` https://leamingtonpride.org.uk — ENOTFOUND
- `gb-saltash` https://saltashpride.org.uk — ENOTFOUND
- `gb-stoke-on-trent` https://www.stokepride.org.uk — ENOTFOUND
- `gb-wakefield` https://wakefieldpride.org.uk — ENOTFOUND
- `gb-worthing` https://worthingpride.org — ENOTFOUND
- `gr-thessaloniki` https://www.thessalonikipride.gr — ERR_TLS_CERT_ALTNAME_INVALID
- `ie-cork` https://corkpride.ie — CERT_HAS_EXPIRED
- `ie-drogheda` https://droghedapride.ie — ENOTFOUND
- `is-reykjavik` https://reykjavikpride.is — TimeoutError
- `it-arco` https://arcopride.it — ENOTFOUND
- `it-bologna` https://www.bolognapride.it — EAI_AGAIN
- `it-pavia` https://www.paviacsd.it — ENOTFOUND
- `it-salerno` https://salernopride.it — ENOTFOUND
- `lu-esch-sur-alzette` https://eschpride.lu — ENOTFOUND
- `md-chisinau` https://www.chisinaupride.md — ENOTFOUND
- `mt-valletta` https://vallettapride.org — ENOTFOUND
- `nl-gouda` https://goudapride.nl — ENOTFOUND
- `nl-maastricht` https://maastrichtpride.nl — ENOTFOUND
- `nl-rotterdam` https://rotterdampride.nl — DEPTH_ZERO_SELF_SIGNED_CERT
- `pl-katowice` https://katowicepride.eu — ENOTFOUND
- `pl-krakow` https://www.queerowymaj.pl — ENOTFOUND
- `pl-poznan` https://www.poznanpride.eu — ENOTFOUND
- `pt-lisboa` https://www.marchalxbt.pt — ENOTFOUND
- `ro-brasov` https://brasovpride.ro — ENOTFOUND
- `se-falun` https://falunpride.se — ENOTFOUND
- `se-gavle` https://gavlepride.se — EAI_AGAIN
- `se-lund` https://lundpride.se — ENOTFOUND
- `sk-bratislava` https://bratislavapride.sk — ERR_TLS_CERT_ALTNAME_INVALID

**Umgezogen (pruefen, ob es noch der Pride ist):**

- `at-velden-am-worthersee` https://www.pinklake.at — → https://www.woerthersee.com/pinklake
- `be-antwerpen` https://antwerppride.be — → https://antwerppride.com/
- `ch-basel` https://baselpride.ch — → https://baselticktbunt.ch/
- `cz-praha` https://www.praguepride.cz — → https://www.praguepride.com/
- `de-dessau-rosslau` https://www.csd-dessau-rosslau.de — → https://csd-sachsenanhalt.de/csd-dessau-rosslau
- `de-erfurt` https://csd-erfurt.de — → https://csderfurt.de/
- `de-esslingen-am-neckar` https://csd-esslingen.de — → https://queeres.eu/
- `de-fulda` https://csd-fulda.de — → https://foll-bunt.de/csd/
- `de-furth` https://csd-fuerth.de — → https://frankenpride.de/csd-fuerth/
- `de-hanau` https://csd-hanau.de — → https://www.queerartikel.de/pages/csd-termine/hanau
- `de-husum` https://csd-husum.de — → https://slfl.de.tl/CSD-Husum.htm
- `de-kothen` https://csd-koethen.de — → https://csd-sachsenanhalt.de/csd-koethen
- `de-landsberg-am-lech` https://csd-landsberg.de — → https://vida-landsberg.de/
- `de-leer` https://csd-leer.de — → https://queerinleer.de/index.php/csd-leer
- `de-magdeburg` https://csd-magdeburg.de — → https://csdmagdeburg.de/
- `de-merseburg` https://www.csd-merseburg.de — → https://csd-sachsenanhalt.de/
- `de-munchen` https://www.csd-muenchen.de — → https://www.csdmuenchen.de/de/
- `de-plauen` https://csd-plauen.de — → https://demokratie-vogtland.de/projekt-db/csd-vogtland/
- `de-regensburg` https://csd-regensburg.de — → https://www.queeresregensburg.de/csd/
- `de-rostock` https://csd-rostock.de — → https://www.csd-hro.de/
- `de-schleswig` https://csd-schleswig.de — → https://slfl.de.tl/CSD-Schleswig.htm
- `de-schonebeck` https://www.csd-schoenebeck.de — → https://csd-sachsenanhalt.de/csd-schoenebeck
- `de-schwandorf` https://www.csd-schwandorf.de — → https://csd-amberg.de/
- `de-stendal` https://csd-stendal.de — → https://csd-sachsenanhalt.de/csd-stendal
- `de-stuttgart` https://www.csd-stuttgart.de — → https://www.stuttgart-pride.de/
- `de-trier` https://csd-trier.de — → https://www.schmit-z.de/verein/csd
- `de-tubingen` https://www.csd-tuebingen.de — → https://csdtuebingen.de/
- `de-wernigerode` https://csd-harz.de — → https://csd-sachsenanhalt.de/csd-harz
- `de-wetzlar` https://csd-lahn.de — → https://csdlahn.de/
- `de-zittau` https://csd-zittau.de — → https://csdzittau.de/
- `gb-derby` https://derbypride.org.uk — → https://www.derbypride.co.uk/
- `gb-liverpool` https://liverpoolpride.co.uk — → https://www.lcrpride.co.uk/
- `gb-salford` https://salfordpride.com — → https://salfordpride.org.uk/
- `nl-utrecht` https://www.utrechtcanalpride.nl — → https://utrechtpride.nl/
- `no-kristiansand` https://kristiansandpride.no — → https://www.skeivesorlandsdager.no/
- `se-malmo` https://malmopride.se — → https://www.malmopride.com/


---

## 2026-10-19 — Erfundene Websites entfernt, kommende Termine 2026 nachgetragen

**Websites:** 61 Websites zeigten auf Domains, die es nicht gibt. Vor dem Loeschen
wurde jede ein zweites Mal per DNS geprueft, mit und ohne `www`. Alle 61 sind raus
(`website: null`). Jeder betroffene Pride traegt jetzt `todo: [{ task: "link" }]` mit
der alten Adresse in der Notiz: Website oder Instagram muss gesucht oder neu zugeordnet
werden. 5 von ihnen haben wenigstens Instagram. `data:status` zaehlt sie in der Spalte
„Link suchen“, in der App erscheint das Feld nicht.

**Termine 2026, die noch bevorstehen** (Benedict am 19.10.2026: kein Schnitt zwischen
2026 und 2027; was dieses Jahr noch stattfindet, bleibt auf der Karte, und ein neuer
Termin 2027 erscheint einfach weit in der Zukunft):

- `pl-srem` neu: Śrem Pride, 24.10.2026, Treffpunkt Plac 20 Października. Quellen:
  csd-termine.de und das Facebook-Event der Gruppe. Ob es derselbe „Karnawał dla
  Równości“ ist, den polishprides.org fuer 2025 nennt, ist offen.
- `de-ansbach` neu: CSD Ansbach, 07.11.2026, laut csd-termine.de vom Jugendrat Ansbach
  und dem Bunten Buendnis Ansbach. Keine eigene Seite gefunden, deshalb `todo: link`.
- `no-tromso` neu: Arctic Pride, Festival 09.–16.11.2026 laut arcticpride.no. Den
  Paradetag 14.11. nennt nur csd-termine.de, er ist noch zu bestaetigen.
- `de-northeim` korrigiert: Der CSD war am 29.08.2026 (Bahnhofsvorplatz), nicht am
  07.11.2026. Das alte Datum war vermutlich eine Verwechslung mit Ansbach. Instagram
  ergaenzt. Northeim ist damit fuer 2027 offen.

Alle vier tragen `announced`, weil die Termine nur aus Uebersichten stammen. Die Websuche
fand zu keinem eine Veranstalter-Seite mit Datum.

---

## 2026-10-19 — Bestaetigungen von Benedict

- `de-ansbach` **confirmed**: frankenpride.de/csd-ansbach nennt den 07.11.2026, Kundgebung
  ab 14:00 am Martin-Luther-Platz, danach Demonstrationszug durch die Innenstadt.
  Veranstalter Franken Pride e.V. (Instagram @frankenpride). `todo: link` erledigt.
- `de-northeim` **confirmed**: 29.08.2026, von Benedict auf Instagram (@csdnortheim)
  bestaetigt.
- `no-tromso`: Website www.arcticpride.no und Instagram @arcticpride_ ergaenzt. Die Seite
  zeigt Veranstaltungen ueber die ganze Festivalwoche, aber keinen Paradetag. Benedict
  uebernimmt den 14.11. von csd-termine.de, der Status bleibt `announced`.
- `pl-srem`: Weder Benedict noch die Websuche auf Polnisch haben etwas gefunden
  (Sprachbarriere). Der Status bleibt `announced` auf Basis von csd-termine.de und dem
  Facebook-Event.

---

## 2026-10-20 — Termine 2027 aus csd-termine.de uebernommen

Beide Seiten heute noch einmal abgerufen (`/deutschland`, `/europa`), jeder Termin mit
seiner Detailseite als Quelle und Status `announced`. Bestaetigt ist davon noch keiner;
das ist die Arbeit der Landeswellen.

- **36 Ausgaben 2027 fuer bekannte Prides:** 26 in DE (Angermuende bis Walsrode, darunter
  Koeln 04.07., Berlin 24.07., Hamburg 07.08.), dazu gb-swansea, nl-alkmaar,
  gb-birmingham, nl-utrecht, ch-zurich, lv-riga, it-torino (EuroPride, 26.06.),
  at-innsbruck, gb-nottingham und nl-amsterdam.
- **8 neue CSDs mit Termin 2027:** de-templin, de-burgstadt, de-niebull, de-buhl,
  de-cuxhaven, de-freital, de-iserlohn, de-waltrop. Koordinaten und Bundesland per
  Nominatim, Groesse geschaetzt, je `todo: link`. Die IDs folgen der bestehenden
  Konvention (Umlaut weggelassen, nicht ausgeschrieben).
- Auffaellig weit vom Vorjahr und deshalb beim Veranstalter zuerst zu bestaetigen:
  de-eschwege (2026 im August, 2027 am 29.05.), de-plauen (August → 04.07.),
  de-neubrandenburg (August → 19.06.).
- Stand danach: 44 von 650 Prides haben einen Termin fuer 2027.

Noch offen aus dem ersten Abgleich: die 31 deutschen CSDs, die 2026 liefen und bei uns
fehlen, die neuen Prides aus /europa und der UK-Liste, und die Frage nach den Trans
Prides (E9).
