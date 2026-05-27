import { useState, useRef } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { COUNTRY_NAMES, flag } from '../utils/countryInfo.js'
import { useLang } from '../contexts/LangContext.jsx'
import { t } from '../utils/i18n.js'
import ColoredTitle from './ColoredTitle.jsx'
import { SIZES, WEEKENDS, VIEW_OPTIONS } from '../utils/filterConstants.js'
import { useFilterHandlers } from '../hooks/useFilterHandlers.js'

export default function MobileSheet({
  filters, onChange, allCountries, totalCount,
  view, onViewChange,
  clusteringEnabled, onClusteringChange,
}) {
  const { lang, setLang } = useLang()
  const [expanded, setExpanded] = useState(false)
  const dragStartY = useRef(null)
  const { toggleCountry, toggleSize, setTimeframe } = useFilterHandlers(filters, onChange)

  const onTouchStart = e => { dragStartY.current = e.touches[0].clientY }
  const onTouchEnd  = e => {
    if (dragStartY.current === null) return
    const delta = dragStartY.current - e.changedTouches[0].clientY
    if (delta > 40)  setExpanded(true)
    if (delta < -40) setExpanded(false)
    dragStartY.current = null
  }

  return (
    <div className={`mobile-sheet ${expanded ? 'expanded' : ''}`}>
      {/* Drag handle — large touch target */}
      <div
        className="sheet-handle-row"
        onClick={() => setExpanded(v => !v)}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div className="sheet-handle" />
        <ColoredTitle className="app-title sheet-title" />
      </div>

      {/* Peek row — most-used filters without expanding */}
      <div className="sheet-peek">
        <div className="sheet-peek-filters">
          {[
            { value: 'upcoming', key: 'upcoming' },
            { value: 'all',      key: 'all' },
          ].map(tf => (
            <button
              key={tf.value}
              className={`toggle-btn ${filters.timeframe === tf.value ? 'active' : ''}`}
              onClick={e => { e.stopPropagation(); onChange({ ...filters, timeframe: tf.value }) }}
            >
              {t(tf.key, lang)}
            </button>
          ))}
          <button
            className={`toggle-btn ${filters.timeframe === 'weekend' ? 'active' : ''}`}
            onClick={e => { e.stopPropagation(); setTimeframe('weekend') }}
          >
            {t('thisWeekend', lang)}
          </button>
        </div>
        <span className="sheet-count">
          <strong>{totalCount}</strong>
        </span>
        <button
          className="sheet-chevron"
          onClick={() => setExpanded(v => !v)}
          aria-label="Toggle filters"
        >
          {expanded ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
        </button>
      </div>

      {/* Expanded body */}
      <div className="sheet-body">
        {/* View + lang row */}
        <div className="sheet-top-row">
          <div className="view-toggle">
            {VIEW_OPTIONS.map(v => (
              <button
                key={v.value}
                className={`view-btn ${view === v.value ? 'active' : ''}`}
                onClick={() => onViewChange(v.value)}
              >
                <img src={`${import.meta.env.BASE_URL}${v.img}`} className="view-flag" alt="" />
                <span className="view-btn-label">{t(v.labelKey, lang)}</span>
              </button>
            ))}
          </div>
          <div className="lang-segmented">
            <button
              className={`toggle-btn ${lang === 'de' ? 'active' : ''}`}
              onClick={() => setLang('de')}
            >DE</button>
            <button
              className={`toggle-btn ${lang === 'en' ? 'active' : ''}`}
              onClick={() => setLang('en')}
            >EN</button>
          </div>
        </div>

        {/* Extra time filters (Past + Next weekend) */}
        <div className="sheet-section">
          <div className="filter-label">{t('filterTime', lang)}</div>
          <div className="toggle-group">
            <button
              className={`toggle-btn ${filters.timeframe === 'past' ? 'active' : ''}`}
              onClick={() => onChange({ ...filters, timeframe: 'past' })}
            >
              {t('past', lang)}
            </button>
            <button
              className={`toggle-btn ${filters.timeframe === 'next-weekend' ? 'active' : ''}`}
              onClick={() => setTimeframe('next-weekend')}
            >
              {t(WEEKENDS.find(w => w.value === 'next-weekend').key, lang)}
            </button>
          </div>
        </div>

        {/* Size */}
        <div className="sheet-section">
          <div className="filter-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>{t('filterSize', lang)}</span>
            {filters.sizes.length > 0 && (
              <button className="clear-btn" onClick={() => onChange({ ...filters, sizes: [] })}>
                {t('clear', lang)}
              </button>
            )}
          </div>
          <div className="toggle-group">
            {SIZES.map(s => (
              <button
                key={s}
                className={`toggle-btn ${filters.sizes.includes(s) ? 'active' : ''}`}
                onClick={() => toggleSize(s)}
              >
                {t(s, lang)}
              </button>
            ))}
          </div>
        </div>

        {/* Country */}
        <div className="sheet-section">
          <div className="filter-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>{t('filterCountry', lang)}</span>
            {filters.countries.length > 0 && (
              <button className="clear-btn" onClick={() => onChange({ ...filters, countries: [] })}>
                {t('clear', lang)} {filters.countries.length}
              </button>
            )}
          </div>
          <div className="country-list mobile-country-list">
            {allCountries.map(code => (
              <div
                key={code}
                className={`country-item ${filters.countries.includes(code) ? 'selected' : ''}`}
                onClick={() => toggleCountry(code)}
              >
                <input type="checkbox" readOnly checked={filters.countries.includes(code)} />
                <span className={`${flag(code)} country-flag`} />
                <span className="country-name">{COUNTRY_NAMES[code] ?? code}</span>
                <span className="country-code">{code}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Display */}
        <div className="sheet-section">
          <div className="filter-label">{t('filterDisplay', lang)}</div>
          <label className="display-toggle-row">
            <input
              type="checkbox"
              checked={clusteringEnabled}
              onChange={e => onClusteringChange(e.target.checked)}
            />
            <span>{t('clusterMarkers', lang)}</span>
          </label>
        </div>

        {/* Footer */}
        <div className="sheet-footer">
          <span>{t('missingParade', lang)}</span>
          <a
            href="https://forms.gle/oo6vk3QfANXskXku8"
            className="suggest-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('suggestOne', lang)}
          </a>
        </div>
        <p className="sidebar-credit">By Benedict Arya Gruber</p>
      </div>
    </div>
  )
}
