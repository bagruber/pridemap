import { useState } from 'react'
import { COUNTRY_NAMES, flag } from '../utils/countryInfo.js'
import { useLang } from '../contexts/LangContext.jsx'
import { t } from '../utils/i18n.js'

const TIMEFRAMES = [
  { value: 'upcoming', key: 'upcoming' },
  { value: 'all',      key: 'all' },
  { value: 'past',     key: 'past' },
]
const WEEKENDS = [
  { value: 'weekend',      key: 'thisWeekend' },
  { value: 'next-weekend', key: 'nextWeekend' },
]
const SIZES = ['small', 'medium', 'large']

export default function MobileSheet({
  filters, onChange, allCountries, totalCount,
  view, onViewChange,
  clusteringEnabled, onClusteringChange,
}) {
  const { lang, toggle: toggleLang } = useLang()
  const [expanded, setExpanded] = useState(false)

  const toggleCountry = code => onChange({
    ...filters,
    countries: filters.countries.includes(code)
      ? filters.countries.filter(c => c !== code)
      : [...filters.countries, code],
  })

  const toggleSize = size => onChange({
    ...filters,
    sizes: filters.sizes.includes(size)
      ? filters.sizes.filter(s => s !== size)
      : [...filters.sizes, size],
  })

  const setTimeframe = value =>
    onChange({ ...filters, timeframe: filters.timeframe === value ? 'upcoming' : value })

  return (
    <div className={`mobile-sheet ${expanded ? 'expanded' : ''}`}>
      {/* Drag handle — tapping anywhere here toggles */}
      <div className="sheet-handle-row" onClick={() => setExpanded(v => !v)}>
        <div className="sheet-handle" />
      </div>

      {/* Peek row — always visible */}
      <div className="sheet-peek">
        <span className="sheet-count">
          <strong>{totalCount}</strong> {t('events', lang)}
        </span>
        <div className="sheet-time-row">
          {TIMEFRAMES.map(tf => (
            <button
              key={tf.value}
              className={`toggle-btn ${filters.timeframe === tf.value ? 'active' : ''}`}
              onClick={e => { e.stopPropagation(); onChange({ ...filters, timeframe: tf.value }) }}
            >
              {t(tf.key, lang)}
            </button>
          ))}
        </div>
        <button
          className="sheet-chevron"
          onClick={() => setExpanded(v => !v)}
          aria-label="Toggle filters"
        >
          {expanded ? '▼' : '▲'}
        </button>
      </div>

      {/* Expanded body */}
      <div className="sheet-body">
        {/* View + lang row */}
        <div className="sheet-top-row">
          <div className="view-toggle">
            {[
              { value: 'europe', img: `${import.meta.env.BASE_URL}Flag_of_Europe.svg`, labelKey: 'viewEurope' },
              { value: 'dach',   img: `${import.meta.env.BASE_URL}D-A-CH_Flag.svg`,    labelKey: 'viewDACH'   },
            ].map(v => (
              <button
                key={v.value}
                className={`view-btn ${view === v.value ? 'active' : ''}`}
                onClick={() => onViewChange(v.value)}
              >
                <img src={v.img} className="view-flag" alt={t(v.labelKey, lang)} /> {t(v.labelKey, lang)}
              </button>
            ))}
          </div>
          <button className="lang-toggle-sheet" onClick={toggleLang}>
            {lang === 'en' ? 'DE' : 'EN'}
          </button>
        </div>

        {/* Weekend quick filters */}
        <div className="sheet-section">
          <div className="filter-label">{t('filterTime', lang)}</div>
          <div className="toggle-group">
            {WEEKENDS.map(w => (
              <button
                key={w.value}
                className={`toggle-btn ${filters.timeframe === w.value ? 'active' : ''}`}
                onClick={() => setTimeframe(w.value)}
              >
                {t(w.key, lang)}
              </button>
            ))}
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
      </div>
    </div>
  )
}
