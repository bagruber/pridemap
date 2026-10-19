import { useLang } from '../contexts/LangContext.jsx'
import { t, tf } from '../utils/i18n.js'
import { COUNTRY_NAMES } from '../utils/countryInfo.js'

const RELAX_KEY = {
  months: 'relaxMonths', countries: 'relaxCountries',
  sizes: 'relaxSizes', timeframe: 'relaxTimeframe',
}

// "Im Juli in Island nichts." — built from whichever filters are actually set,
// so the sentence names the dead end instead of describing it in general.
function headline(filters, lang) {
  const locale = lang === 'de' ? 'de-DE' : 'en-GB'
  const place = filters.countries.length === 1
    ? (COUNTRY_NAMES[filters.countries[0]] ?? filters.countries[0])
    : null
  const month = filters.months.length === 1
    ? new Date(2000, filters.months[0] - 1, 1).toLocaleDateString(locale, { month: 'long' })
    : null
  if (!place && !month) return t('noEventsMatch', lang)
  return tf('nothingIn', lang, {
    where: place ? tf('whereIn', lang, { place }) : '',
    when: month ? tf('whenIn', lang, { month }) : '',
  }).replace(/\s+/g, ' ').replace(' .', '.')
}

/**
 * A dead end that offers a way out.
 *
 * The old version was a large magnifier-with-a-cross and the sentence "no
 * events match your filters" — true, and no help. Now it names the filters in
 * the way and offers to loosen the two that would actually find something.
 */
export default function EmptyState({
  title, action, actionLabel, linkHref, linkLabel,
  filters, relaxations: options = [], onRelax,
}) {
  const { lang } = useLang()
  const text = title ?? (filters ? headline(filters, lang) : null)

  return (
    <div className="empty-state">
      <div className="empty-state-text">{text}</div>
      {options.slice(0, 2).map(r => (
        <button
          key={r.key}
          type="button"
          className="empty-state-action"
          onClick={() => onRelax(r.filters)}
        >
          {tf(RELAX_KEY[r.key], lang, { n: r.count })}
        </button>
      ))}
      {action && (
        <button className="empty-state-link" onClick={action}>
          {actionLabel}
        </button>
      )}
      {linkHref && (
        <a className="empty-state-link" href={linkHref} target="_blank" rel="noopener noreferrer">
          {linkLabel}
        </a>
      )}
    </div>
  )
}
