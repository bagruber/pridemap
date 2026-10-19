import { useState, useMemo } from 'react'
import { X } from 'lucide-react'
import { colorForDays } from '../utils/timeColors.js'
import { flag } from '../utils/countryInfo.js'
import { useLang } from '../contexts/LangContext.jsx'
import { t, tf, cityName, labelForDaysL10n, formatDate } from '../utils/i18n.js'
import { isFirstTime } from '../utils/firstTime.js'
import { norm } from '../utils/text.js'
import { searchParades } from '../utils/search.js'
import MiniLegend from './MiniLegend.jsx'

function ListRow({ parade, onSelect, lang }) {
  const color = colorForDays(parade.daysUntil)
  const displayCity = cityName(parade, lang)
  const hasCustomName = parade.name && norm(parade.name) !== norm(parade.city)
  const isPast = parade.daysUntil < 0
  const { open, lastDate } = parade

  // Without a date, last year's is the only anchor there is
  const dateStr = open
    ? (lastDate ? tf('lastHeld', lang, {
        year: lastDate.slice(0, 4),
        date: formatDate(lastDate, lang, { day: 'numeric', month: 'short' }),
      }) : '')
    : formatDate(parade.date, lang, { day: 'numeric', month: 'short' })

  const countdown = open ? '' : labelForDaysL10n(parade.daysUntil, lang)

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
      {/* Premiere and "moved" ride on the dot, the way they do on the map,
          instead of repeating themselves as text chips beside the name */}
      <div
        className={`list-dot ${isFirstTime(parade) ? 'is-premiere' : ''} ${parade.movedFrom ? 'is-moved' : ''}`}
        title={isFirstTime(parade) ? tf('firstTimeNote', lang, { year: parade.year }) : movedTitle}
        style={open
          ? { background: 'transparent', boxShadow: `inset 0 0 0 1.5px ${color}` }
          : { background: color }}
      />
      <span className={`${flag(parade.country)} list-flag fi`} />
      <div className="list-main">
        <span className="list-city">{displayCity}</span>
        {parade.region && <span className="list-region">{parade.region}</span>}
        {hasCustomName && <span className="list-name">{parade.name}</span>}
      </div>
      <div className="list-date">
        <span className="list-date-str">{dateStr}</span>
        {countdown && (
          <span className="list-countdown" style={{ color: isPast ? 'var(--text-dim)' : color }}>
            {countdown}
          </span>
        )}
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

  // Prides still waiting for a date go in their own block at the end, ordered
  // by last year's date — otherwise they would have to fake a position in a
  // list that is sorted by something they do not have.
  const dated = displayed.filter(p => !p.open)
  const openList = displayed
    .filter(p => p.open)
    .sort((a, b) => (a.lastDate ?? '').slice(5).localeCompare((b.lastDate ?? '').slice(5)))

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
              <div className="empty-state-text">{t('noResults', lang)}</div>
            </div>
          )
          : (
            <>
              {dated.map(p => (
                <ListRow key={p.id} parade={p} onSelect={onSelect} lang={lang} />
              ))}
              {openList.length > 0 && (
                <div className="list-group-head">
                  {t('openSection', lang)} <span>{openList.length}</span>
                </div>
              )}
              {openList.map(p => (
                <ListRow key={p.id} parade={p} onSelect={onSelect} lang={lang} />
              ))}
            </>
          )
        }
      </div>
    </main>
  )
}
