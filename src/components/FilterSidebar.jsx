import { COUNTRY_NAMES, flag } from '../utils/countryInfo.js'
import { useLang } from '../contexts/LangContext.jsx'
import { t } from '../utils/i18n.js'

const SIZES = ['small', 'medium', 'large']
const TIMEFRAMES = [
  { value: 'upcoming', key: 'upcoming' },
  { value: 'all',      key: 'all' },
  { value: 'past',     key: 'past' },
]
const WEEKENDS = [
  { value: 'weekend',      key: 'thisWeekend' },
  { value: 'next-weekend', key: 'nextWeekend' },
]

export default function FilterSidebar({
  filters, onChange, allCountries, totalCount,
  view, onViewChange,
  clusteringEnabled, onClusteringChange,
}) {
  const { lang, setLang } = useLang()

  const toggleCountry = (code) => {
    const next = filters.countries.includes(code)
      ? filters.countries.filter(c => c !== code)
      : [...filters.countries, code]
    onChange({ ...filters, countries: next })
  }

  const toggleSize = (size) => {
    const next = filters.sizes.includes(size)
      ? filters.sizes.filter(s => s !== size)
      : [...filters.sizes, size]
    onChange({ ...filters, sizes: next })
  }

  const setTimeframe = (value) => {
    const next = filters.timeframe === value ? 'upcoming' : value
    onChange({ ...filters, timeframe: next })
  }

  return (
    <div className="filter-sidebar">
      <div className="sidebar-header">
        <div className="sidebar-title-row">
          <h1 className="app-title">{t('appTitle', lang)}</h1>
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
        <div className="sidebar-count">
          {t('showingEvents', lang)} <strong>{totalCount}</strong> {t('events', lang)}
        </div>
      </div>

      <div className="sidebar-body">
        <div className="filter-group">
          <div className="filter-label">{t('filterTime', lang)}</div>
          <div className="toggle-group">
            {TIMEFRAMES.map(tf => (
              <button
                key={tf.value}
                className={`toggle-btn ${filters.timeframe === tf.value ? 'active' : ''}`}
                onClick={() => onChange({ ...filters, timeframe: tf.value })}
              >
                {t(tf.key, lang)}
              </button>
            ))}
          </div>
          <div className="toggle-group weekend-group">
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

        <div className="filter-group">
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

        <div className="filter-group">
          <div className="filter-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>{t('filterCountry', lang)}</span>
            {filters.countries.length > 0 && (
              <button className="clear-btn" onClick={() => onChange({ ...filters, countries: [] })}>
                {t('clear', lang)} {filters.countries.length}
              </button>
            )}
          </div>
          <div className="country-list">
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

        <div className="filter-group">
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
      </div>

      <div className="sidebar-footer">
        <div className="sidebar-footer-row">
          <span>{t('missingParade', lang)}</span>
          <a href="https://forms.gle/oo6vk3QfANXskXku8" className="suggest-link" target="_blank" rel="noopener noreferrer">
            {t('suggestOne', lang)}
          </a>
        </div>
        <p className="sidebar-disclaimer">
          {t('disclaimer', lang)}
        </p>
      </div>
    </div>
  )
}
