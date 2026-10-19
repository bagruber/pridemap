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
