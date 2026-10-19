import { ChevronDown } from 'lucide-react'
import { useLang } from '../../contexts/LangContext.jsx'
import { t, tf } from '../../utils/i18n.js'
import { COUNTRY_NAMES } from '../../utils/countryInfo.js'

const TIME_SHORT = {
  upcoming: 'upcoming', all: 'all', past: 'past',
  weekend: 'thisWeekend', 'next-weekend': 'nextWeekend',
}

function monthLabel(months, lang) {
  if (!months.length) return t('filterMonth', lang)
  const locale = lang === 'de' ? 'de-DE' : 'en-GB'
  const first = new Date(2000, months[0] - 1, 1)
    .toLocaleDateString(locale, { month: 'short' }).replace(/\.$/, '')
  return months.length === 1 ? first : tf('monthPlus', lang, { month: first, n: months.length - 1 })
}

function countryLabel(countries, lang) {
  if (!countries.length) return t('filterCountry', lang)
  if (countries.length === 1) return COUNTRY_NAMES[countries[0]] ?? countries[0]
  return tf('nCountries', lang, { n: countries.length })
}

function sizeLabel(sizes, lang) {
  if (!sizes.length) return t('filterSize', lang)
  if (sizes.length === 1) return t(sizes[0], lang)
  return `${t('filterSize', lang)} ${sizes.length}`
}

/**
 * The filters as a scrollable row of chips, the way a maps app shows them.
 * Each chip carries its own value, so the bar doubles as the answer to "what
 * am I looking at" — which the old sidebar could only give by being open.
 */
export default function FilterChips({ filters, active, onPick, onReset }) {
  const { lang } = useLang()

  const chips = [
    { key: 'time', label: t(TIME_SHORT[filters.timeframe] ?? 'upcoming', lang), on: filters.timeframe !== 'upcoming' },
    { key: 'month', label: monthLabel(filters.months, lang), on: filters.months.length > 0 },
    { key: 'size', label: sizeLabel(filters.sizes, lang), on: filters.sizes.length > 0 },
    { key: 'country', label: countryLabel(filters.countries, lang), on: filters.countries.length > 0 },
    { key: 'more', label: t('more', lang), on: false },
  ]
  const anyActive = chips.some(c => c.on)

  return (
    <div className="chip-row" role="group" aria-label={t('filterTime', lang)}>
      {chips.map(c => (
        <button
          key={c.key}
          type="button"
          className={`chip ${c.on ? 'is-on' : ''} ${active === c.key ? 'is-open' : ''}`}
          aria-expanded={active === c.key}
          onClick={() => onPick(active === c.key ? null : c.key)}
        >
          {c.label}
          <ChevronDown size={14} aria-hidden="true" />
        </button>
      ))}
      {anyActive && (
        <button type="button" className="chip-reset" onClick={onReset}>
          {t('reset', lang)}
        </button>
      )}
    </div>
  )
}
