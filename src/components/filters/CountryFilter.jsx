import FilterLabel from './FilterLabel.jsx'
import { COUNTRY_NAMES, flag } from '../../utils/countryInfo.js'
import { useLang } from '../../contexts/LangContext.jsx'
import { t } from '../../utils/i18n.js'

export default function CountryFilter({ filters, onChange, allCountries, toggleCountry, listClassName = '' }) {
  const { lang } = useLang()
  return (
    <>
      <FilterLabel
        onClear={filters.countries.length > 0 ? () => onChange({ ...filters, countries: [] }) : null}
        clearCount={filters.countries.length}
      >
        {t('filterCountry', lang)}
      </FilterLabel>
      <div className={`country-list ${listClassName}`}>
        {allCountries.map(code => {
          const selected = filters.countries.includes(code)
          return (
            <label key={code} className={`country-item ${selected ? 'selected' : ''}`}>
              <input
                type="checkbox"
                checked={selected}
                onChange={() => toggleCountry(code)}
              />
              <span className={`${flag(code)} country-flag`} />
              <span className="country-name">{COUNTRY_NAMES[code] ?? code}</span>
              <span className="country-code">{code}</span>
            </label>
          )
        })}
      </div>
    </>
  )
}
