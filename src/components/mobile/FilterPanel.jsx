import { useLang } from '../../contexts/LangContext.jsx'
import { t, tf } from '../../utils/i18n.js'
import { useFilterHandlers } from '../../hooks/useFilterHandlers.js'
import { SIZES } from '../../utils/filterConstants.js'
import TimeFilter from '../filters/TimeFilter.jsx'
import CountryPicker from '../filters/CountryPicker.jsx'
import RegionToggle from '../filters/RegionToggle.jsx'
import LangToggle from '../filters/LangToggle.jsx'
import ClusterToggle from '../filters/ClusterToggle.jsx'

const SIZE_DOT = { small: 7, medium: 11, large: 17 }

function MonthOptions({ filters, toggleMonth, lang }) {
  const locale = lang === 'de' ? 'de-DE' : 'en-GB'
  return (
    <div className="option-grid">
      {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
        <button
          key={m}
          type="button"
          className={`option-cell ${filters.months.includes(m) ? 'is-on' : ''}`}
          aria-pressed={filters.months.includes(m)}
          onClick={() => toggleMonth(m)}
        >
          {new Date(2000, m - 1, 1).toLocaleDateString(locale, { month: 'short' }).replace(/\.$/, '')}
        </button>
      ))}
    </div>
  )
}

function SizeOptions({ filters, toggleSize, lang }) {
  return (
    <>
      <div className="option-pills">
        {SIZES.map(s => (
          <button
            key={s}
            type="button"
            className={`option-pill ${filters.sizes.includes(s) ? 'is-on' : ''}`}
            aria-pressed={filters.sizes.includes(s)}
            onClick={() => toggleSize(s)}
          >
            <span
              className="option-pill-dot"
              style={{ width: SIZE_DOT[s], height: SIZE_DOT[s] }}
            />
            {t(s, lang)}
          </button>
        ))}
      </div>
      <p className="option-note">{t('sizeScale', lang)}</p>
    </>
  )
}

/**
 * The options behind one chip. Everything here is a component the desktop
 * sidebar shows too — the filter UI used to exist twice, once per breakpoint,
 * and the two had drifted.
 */
export default function FilterPanel({
  which, filters, onChange, allCountries, countryCounts, totalCount,
  view, onViewChange, clusteringEnabled, onClusteringChange,
  isoSlot, onClose, onReset,
}) {
  const { lang } = useLang()
  const { toggleCountry, toggleSize, toggleMonth } = useFilterHandlers(filters, onChange)

  const title = {
    time: 'filterTime', month: 'filterMonth', size: 'filterSize',
    country: 'filterCountry', more: 'more',
  }[which]

  return (
    <div className="filter-panel">
      <div className="filter-panel-head">
        <h2>{t(title, lang)}</h2>
        <button type="button" className="filter-panel-reset" onClick={onReset}>
          {t('reset', lang)}
        </button>
        <button type="button" className="filter-panel-done" onClick={onClose}>
          {tf('showN', lang, { n: totalCount })}
        </button>
      </div>

      <div className="filter-panel-body">
        {which === 'time' && <TimeFilter filters={filters} onChange={onChange} />}
        {which === 'month' && <MonthOptions filters={filters} toggleMonth={toggleMonth} lang={lang} />}
        {which === 'size' && <SizeOptions filters={filters} toggleSize={toggleSize} lang={lang} />}
        {which === 'country' && (
          <CountryPicker
            filters={filters}
            onChange={onChange}
            allCountries={allCountries}
            counts={countryCounts}
            toggleCountry={toggleCountry}
          />
        )}
        {which === 'more' && (
          <div className="more-options">
            <RegionToggle view={view} onViewChange={onViewChange} withLabel />
            <ClusterToggle
              clusteringEnabled={clusteringEnabled}
              onClusteringChange={onClusteringChange}
            />
            <LangToggle />
            {isoSlot}
          </div>
        )}
      </div>
    </div>
  )
}
