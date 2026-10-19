import { useMemo } from 'react'
import { colorForDays } from '../../utils/timeColors.js'
import { flag } from '../../utils/countryInfo.js'
import { useLang } from '../../contexts/LangContext.jsx'
import { t, tf, cityName, labelForDaysL10n, formatDate } from '../../utils/i18n.js'
import { isFirstTime } from '../../utils/firstTime.js'
import { norm } from '../../utils/text.js'

function Row({ p, onSelect, lang }) {
  const color = colorForDays(p.daysUntil)
  const city = cityName(p, lang)
  // The name only earns its line when it says more than the city already does
  const name = p.name && norm(p.name) !== norm(city) && norm(p.name) !== norm(p.city) ? p.name : null
  const premiere = isFirstTime(p)

  return (
    <button type="button" className="res-row" onClick={() => onSelect(p.id)}>
      <span
        className={`res-dot ${premiere ? 'is-premiere' : ''} ${p.movedFrom ? 'is-moved' : ''}`}
        style={p.open
          ? { background: 'transparent', boxShadow: `inset 0 0 0 1.5px ${color}` }
          : { background: color }}
      />
      <span className="res-main">
        <span className="res-line">
          <span className="res-city">{city}</span>
          <span className={`${flag(p.country)} res-flag`} />
        </span>
        {(name || p.region || p.movedFrom) && (
          <span className="res-sub">
            {name}
            {name && p.region ? ' · ' : ''}
            {p.region}
            {p.movedFrom && (
              <span className="res-moved">
                {' · '}{t('movedFrom', lang)}{' '}
                {formatDate(p.movedFrom, lang, { day: 'numeric', month: 'short' })}
              </span>
            )}
          </span>
        )}
      </span>
      <span className="res-when" style={{ color: p.open || p.daysUntil < 0 ? undefined : color }}>
        {p.open
          ? (p.lastDate
              ? tf('lastHeld', lang, {
                  year: p.lastDate.slice(0, 4),
                  date: formatDate(p.lastDate, lang, { day: 'numeric', month: 'short' }),
                })
              : t('dateOpen', lang))
          : labelForDaysL10n(p.daysUntil, lang)}
      </span>
    </button>
  )
}

/**
 * Results grouped by date. A flat list of 500 rows sorted by date hides the
 * one thing someone scanning it wants: which day are we talking about now.
 */
export default function ResultList({ parades, onSelect }) {
  const { lang } = useLang()

  const groups = useMemo(() => {
    const dated = parades.filter(p => !p.open).sort((a, b) => a.date.localeCompare(b.date))
    const open = parades.filter(p => p.open)
      .sort((a, b) => (a.lastDate ?? '').slice(5).localeCompare((b.lastDate ?? '').slice(5)))
    const out = []
    for (const p of dated) {
      if (!out.length || out[out.length - 1].date !== p.date) out.push({ date: p.date, rows: [] })
      out[out.length - 1].rows.push(p)
    }
    if (open.length) out.push({ date: null, rows: open })
    return out
  }, [parades])

  return (
    <div className="res-list">
      {groups.map(g => (
        <section key={g.date ?? 'open'}>
          <h3 className="res-group">
            <span>
              {g.date
                ? formatDate(g.date, lang, { weekday: 'short', day: 'numeric', month: 'long' })
                : t('openSection', lang)}
            </span>
            <span className="res-group-count">{g.rows.length}</span>
          </h3>
          {g.rows.map(p => <Row key={p.id} p={p} onSelect={onSelect} lang={lang} />)}
        </section>
      ))}
    </div>
  )
}
