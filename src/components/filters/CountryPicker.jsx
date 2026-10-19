import { useState, useMemo } from 'react'
import { Search } from 'lucide-react'
import { COUNTRY_NAMES, flag } from '../../utils/countryInfo.js'
import { useLang } from '../../contexts/LangContext.jsx'
import { t } from '../../utils/i18n.js'
import { norm } from '../../utils/text.js'

/**
 * Countries with a search box, sorted by name and carrying their count.
 *
 * The old list was sorted by ISO code, so Austria sat under AT between Albania
 * and Bosnia, and it was seven rows tall with 38 entries in it.
 */
export default function CountryPicker({ filters, onChange, allCountries, counts, toggleCountry }) {
  const { lang } = useLang()
  const [query, setQuery] = useState('')

  const rows = useMemo(() => {
    const q = norm(query.trim())
    const name = c => COUNTRY_NAMES[c] ?? c
    return allCountries
      .filter(c => !q || norm(name(c)).includes(q) || norm(c).includes(q))
      .sort((a, b) => {
        // Chosen ones stay on top, so a selection does not scroll out of sight
        const sel = filters.countries.includes(b) - filters.countries.includes(a)
        return sel || name(a).localeCompare(name(b), lang)
      })
  }, [allCountries, query, filters.countries, lang])

  return (
    <div className="country-picker">
      <label className="country-search">
        <Search size={15} aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={t('searchCountry', lang)}
          aria-label={t('searchCountry', lang)}
        />
      </label>
      <div className="country-rows">
        {rows.map(code => {
          const selected = filters.countries.includes(code)
          return (
            <label key={code} className={`country-row ${selected ? 'is-on' : ''}`}>
              <input type="checkbox" checked={selected} onChange={() => toggleCountry(code)} />
              <span className={`${flag(code)} country-row-flag`} />
              <span className="country-row-name">{COUNTRY_NAMES[code] ?? code}</span>
              <span className="country-row-count">{counts?.[code] ?? 0}</span>
            </label>
          )
        })}
      </div>
    </div>
  )
}
