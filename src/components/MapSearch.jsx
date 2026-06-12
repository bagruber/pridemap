import { useState, useRef } from 'react'
import { Search, X } from 'lucide-react'
import { COUNTRY_NAMES, flag } from '../utils/countryInfo.js'
import { norm } from '../utils/text.js'
import { useLang } from '../contexts/LangContext.jsx'
import { t, cityName, formatDate } from '../utils/i18n.js'

const MAX_RESULTS = 8

export default function MapSearch({ parades, onPick }) {
  const { lang } = useLang()
  const [query, setQuery] = useState('')
  const [highlight, setHighlight] = useState(0)
  const inputRef = useRef(null)

  const q = norm(query.trim())
  // Tiered match: city prefix > city substring > event name > region/country,
  // so e.g. "ber" surfaces Berlin before Baden-Württemberg towns
  const results = []
  if (q.length >= 2) {
    const scored = []
    for (const p of parades) {
      const cities = [p.city, cityName(p.city, 'en'), cityName(p.city, 'de')].map(norm)
      let tier
      if (cities.some(c => c.startsWith(q))) tier = 0
      else if (cities.some(c => c.includes(q))) tier = 1
      else if (norm(p.name ?? '').includes(q)) tier = 2
      else if (norm(p.region ?? '').includes(q) || norm(COUNTRY_NAMES[p.country] ?? '').includes(q)) tier = 3
      else continue
      scored.push([tier, p])
    }
    scored.sort((a, b) =>
      a[0] - b[0] ||
      (a[1].daysUntil < 0) - (b[1].daysUntil < 0) ||
      a[1].daysUntil - b[1].daysUntil)
    results.push(...scored.slice(0, MAX_RESULTS).map(s => s[1]))
  }

  const pick = p => {
    setQuery('')
    setHighlight(0)
    inputRef.current?.blur()
    onPick(p)
  }

  const onKeyDown = e => {
    if (e.key === 'Escape') {
      if (query) {
        e.stopPropagation() // don't also close the detail panel
        setQuery('')
        setHighlight(0)
      }
      return
    }
    if (!results.length) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlight(h => Math.min(h + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight(h => Math.max(h - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      pick(results[highlight] ?? results[0])
    }
  }

  return (
    <div className="map-search">
      <Search size={14} className="map-search-icon" aria-hidden="true" />
      <input
        ref={inputRef}
        className="map-search-input"
        type="text"
        role="combobox"
        aria-expanded={results.length > 0}
        aria-label={t('searchParades', lang)}
        placeholder={t('searchParades', lang)}
        value={query}
        onChange={e => { setQuery(e.target.value); setHighlight(0) }}
        onKeyDown={onKeyDown}
      />
      {query && (
        <button
          className="map-search-clear"
          onClick={() => { setQuery(''); setHighlight(0); inputRef.current?.focus() }}
          aria-label="Clear search"
          type="button"
        >
          <X size={13} />
        </button>
      )}
      {results.length > 0 && (
        <div className="map-search-results" role="listbox">
          {results.map((p, i) => (
            <button
              key={p.id}
              type="button"
              role="option"
              aria-selected={i === highlight}
              className={`map-search-item ${i === highlight ? 'highlight' : ''}`}
              onMouseEnter={() => setHighlight(i)}
              // mousedown, not click: fires before the input loses focus
              onMouseDown={e => { e.preventDefault(); pick(p) }}
            >
              <span className={`${flag(p.country)} map-search-flag`} />
              <span className="map-search-city">
                {cityName(p.city, lang)}
                {p.region && <span className="map-search-region"> · {p.region}</span>}
              </span>
              <span className="map-search-date">
                {formatDate(p.date, lang, { day: 'numeric', month: 'short' })}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
