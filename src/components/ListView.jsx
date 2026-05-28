import { useState, useMemo } from 'react'
import { X, SearchX } from 'lucide-react'
import { colorForDays, labelForDays } from '../utils/timeColors.js'
import { flag } from '../utils/countryInfo.js'
import { useLang } from '../contexts/LangContext.jsx'
import { t, cityName } from '../utils/i18n.js'
import { toSelection } from '../utils/parade.js'
import MiniLegend from './MiniLegend.jsx'

function norm(s) {
  return (s ?? '').toLowerCase()
    .replace(/ß/g, 'ss')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

function ListRow({ parade, onSelect, lang }) {
  const color = colorForDays(parade.daysUntil)
  const displayCity = cityName(parade.city, lang)
  const hasCustomName = parade.name && norm(parade.name) !== norm(parade.city)
  const isPast = parade.daysUntil < 0

  const dateStr = new Date(parade.date).toLocaleDateString(
    lang === 'de' ? 'de-DE' : 'en-GB',
    { day: 'numeric', month: 'short' }
  )

  const countdown = isPast
    ? `${Math.abs(parade.daysUntil)}d`
    : parade.daysUntil === 0 ? t('today', lang)
    : parade.daysUntil === 1 ? t('tomorrow', lang)
    : labelForDays(parade.daysUntil)

  const handleSelect = () => onSelect(toSelection({ ...parade, color }))
  const handleKey = e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleSelect()
    }
  }

  return (
    <div
      className="list-row"
      onClick={handleSelect}
      onKeyDown={handleKey}
      role="button"
      tabIndex={0}
    >
      <div className="list-dot" style={{ background: color }} />
      <span className={`${flag(parade.country)} list-flag fi`} />
      <div className="list-main">
        <span className="list-city">{displayCity}</span>
        {parade.region && <span className="list-region">{parade.region}</span>}
        {hasCustomName && <span className="list-name">{parade.name}</span>}
      </div>
      <div className="list-date">
        <span className="list-date-str">{dateStr}</span>
        <span className="list-countdown" style={{ color: isPast ? 'var(--text-dim)' : color }}>
          {countdown}
        </span>
      </div>
    </div>
  )
}

export default function ListView({ parades, onSelect }) {
  const { lang } = useLang()
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState('date')

  const displayed = useMemo(() => {
    const q = norm(query)
    const filtered = q
      ? parades.filter(p => {
          const haystack = [
            p.city,
            cityName(p.city, 'en'),
            cityName(p.city, 'de'),
            p.name ?? '',
            p.region ?? '',
          ].map(norm).join(' ')
          return haystack.includes(q)
        })
      : parades

    return [...filtered].sort((a, b) =>
      sortBy === 'date'
        ? a.daysUntil - b.daysUntil
        : norm(cityName(a.city, lang)).localeCompare(norm(cityName(b.city, lang)))
    )
  }, [parades, query, sortBy, lang])

  return (
    <div className="list-view">
      <div className="list-toolbar">
        <div className="list-search-wrap">
          <input
            className="list-search"
            placeholder={t('searchParades', lang)}
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {query && (
            <button
              className="list-search-clear"
              onClick={() => setQuery('')}
              aria-label="Clear search"
              type="button"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <div className="list-sort-group">
          <span className="list-sort-label">{t('sortBy', lang)}</span>
          <div className="toggle-group">
            <button
              className={`toggle-btn ${sortBy === 'date' ? 'active' : ''}`}
              onClick={() => setSortBy('date')}
            >{t('sortDate', lang)}</button>
            <button
              className={`toggle-btn ${sortBy === 'name' ? 'active' : ''}`}
              onClick={() => setSortBy('name')}
            >{t('sortName', lang)}</button>
          </div>
        </div>
        <MiniLegend className="list-mini-legend" />
      </div>

      <div className="list-items">
        {displayed.length === 0
          ? (
            <div className="empty-state">
              <SearchX size={32} strokeWidth={1.5} />
              <div className="empty-state-text">{t('noResults', lang)}</div>
            </div>
          )
          : displayed.map(p => (
              <ListRow key={p.id} parade={p} onSelect={onSelect} lang={lang} />
            ))
        }
      </div>
    </div>
  )
}
