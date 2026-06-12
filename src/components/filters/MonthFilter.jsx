import FilterLabel from './FilterLabel.jsx'
import { useLang } from '../../contexts/LangContext.jsx'
import { t } from '../../utils/i18n.js'

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1)

export default function MonthFilter({ filters, onChange, toggleMonth }) {
  const { lang } = useLang()
  const locale = lang === 'de' ? 'de-DE' : 'en-GB'
  return (
    <>
      <FilterLabel
        onClear={filters.months.length > 0 ? () => onChange({ ...filters, months: [] }) : null}
        clearCount={filters.months.length}
      >
        {t('filterMonth', lang)}
      </FilterLabel>
      <div className="month-grid">
        {MONTHS.map(m => (
          <button
            key={m}
            className={`toggle-btn ${filters.months.includes(m) ? 'active' : ''}`}
            onClick={() => toggleMonth(m)}
          >
            {new Date(2026, m - 1, 1).toLocaleDateString(locale, { month: 'short' }).replace(/\.$/, '')}
          </button>
        ))}
      </div>
    </>
  )
}
