import { useState, useMemo } from 'react'
import { X, SearchX, Sparkles } from 'lucide-react'
import { colorForDays } from '../utils/timeColors.js'
import { flag } from '../utils/countryInfo.js'
import { useLang } from '../contexts/LangContext.jsx'
import { t, cityName, labelForDaysL10n, formatDate } from '../utils/i18n.js'
import { isFirstTime } from '../utils/firstTime.js'
import { norm } from '../utils/text.js'
import { searchParades } from '../utils/search.js'
import MiniLegend from './MiniLegend.jsx'

function ListRow({ parade, onSelect, lang }) {
  const color = colorForDays(parade.daysUntil)
  const displayCity = cityName(parade, lang)
  const hasCustomName = parade.name && norm(parade.name) !== norm(parade.city)
  const isPast = parade.daysUntil < 0

  const dateStr = formatDate(parade.date, lang, { day: 'numeric', month: 'short' })

  const countdown = labelForDaysL10n(parade.daysUntil, lang)

  const movedTitle = parade.movedFrom
    ? `${t('movedFrom', lang)} ${formatDate(parade.movedFrom, lang, { day: 'numeric', month: 'long', year: 'numeric' })}`
    : undefined

  const handleSelect = () => onSelect(parade.id)
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
        {isFirstTime(parade) && (
          <span className="list-premiere" title={t('firstTimeNote', lang)}>
            <Sparkles size={9} aria-hidden="true" />
            {t('firstTimeShort', lang)}
          </span>
        )}
        {parade.movedFrom && (
          <span className="list-moved" title={movedTitle}>
            {t('rescheduledShort', lang)}
          </span>
        )}
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

  // The search is shared with the map's search box; only the sort is the
  // list's own, so the chosen order wins over the search ranking.
  const displayed = useMemo(() =>
    searchParades(parades, query).sort((a, b) =>
      sortBy === 'date'
        ? a.daysUntil - b.daysUntil
        : norm(cityName(a, lang)).localeCompare(norm(cityName(b, lang)))
    ), [parades, query, sortBy, lang])

  return (
    <main className="list-view">
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
    </main>
  )
}
