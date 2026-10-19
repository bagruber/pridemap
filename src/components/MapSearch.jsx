import { useState, useRef } from 'react'
import { Search, X } from 'lucide-react'
import { flag } from '../utils/countryInfo.js'
import { searchParades } from '../utils/search.js'
import { useLang } from '../contexts/LangContext.jsx'
import { t, tf, cityName, formatDate } from '../utils/i18n.js'

const MAX_RESULTS = 8

export default function MapSearch({ parades, onPick }) {
  const { lang } = useLang()
  const [query, setQuery] = useState('')
  const [highlight, setHighlight] = useState(0)
  const inputRef = useRef(null)

  // Below two characters the dropdown would just be a list of everything
  const q = query.trim()
  const results = q.length >= 2 ? searchParades(parades, q).slice(0, MAX_RESULTS) : []

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
                {cityName(p, lang)}
                {p.region && <span className="map-search-region"> · {p.region}</span>}
              </span>
              <span className={`map-search-date${p.open ? ' is-open' : ''}`}>
                {p.open
                  ? (p.lastDate
                      ? tf('lastHeld', lang, {
                          year: p.lastDate.slice(0, 4),
                          date: formatDate(p.lastDate, lang, { day: 'numeric', month: 'short' }),
                        })
                      : t('dateOpen', lang))
                  : formatDate(p.date, lang, { day: 'numeric', month: 'short' })}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
