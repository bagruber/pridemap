import FilterLabel from './FilterLabel.jsx'
import { SIZES } from '../../utils/filterConstants.js'
import { useLang } from '../../contexts/LangContext.jsx'
import { t } from '../../utils/i18n.js'

export default function SizeFilter({ filters, onChange, toggleSize }) {
  const { lang } = useLang()
  return (
    <>
      <FilterLabel
        onClear={filters.sizes.length > 0 ? () => onChange({ ...filters, sizes: [] }) : null}
      >
        {t('filterSize', lang)}
      </FilterLabel>
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
    </>
  )
}
