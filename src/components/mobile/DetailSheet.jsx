import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { X, CalendarPlus, Globe, Navigation, Share2 } from 'lucide-react'
import InstagramIcon from '../InstagramIcon.jsx'
import DetailMedia from './DetailMedia.jsx'
import { colorForDays, indexColor } from '../../utils/timeColors.js'
import { COUNTRY_NAMES, flag } from '../../utils/countryInfo.js'
import { isFirstTime } from '../../utils/firstTime.js'
import { useLang } from '../../contexts/LangContext.jsx'
import { t, tf, cityName, indexLabelL10n, labelForDaysLong, formatDate } from '../../utils/i18n.js'
import { useSheetDrag } from '../../hooks/useSheetDrag.js'
import { downloadICS } from '../../utils/ics.js'
import { track } from '../../utils/track.js'

// The handle strip above the content; the air below it belongs to .detail-peek
const CHROME = 36
const EXPANDED = 776

// iOS opens Apple Maps for its own scheme and nothing for Google's deep link
const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent ?? '')
const routeUrl = p => isIOS()
  ? `https://maps.apple.com/?daddr=${p.lat},${p.lon}`
  : `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lon}`

const fmtCount = n => n >= 1000000 ? `≥${n / 1000000}M` : n >= 1000 ? `≥${n / 1000}k` : `≥${n}`

/**
 * The detail as a two-stop sheet.
 *
 * Collapsed it answers the two questions someone taps a dot for — where and
 * when — and offers the actions, which sit at the bottom where a thumb is.
 * Pulled up it adds everything else, and only what has a value.
 */
export default function DetailSheet({ parade: p, onClose, onHeightChange }) {
  const { lang } = useLang()
  const color = colorForDays(p.daysUntil)
  const city = cityName(p, lang)
  const isPast = p.daysUntil < 0
  const att = useMemo(
    () => [...(p.attendance ?? [])].sort((a, b) => (b.year ?? 0) - (a.year ?? 0))[0],
    [p.attendance],
  )

  // The collapsed height is measured, not guessed. It used to be 150 px plus
  // 44 if there were links — numbers that fit the mock and nothing else: a
  // Pride with a two-line name was cut off, one without links kept a gap, and
  // a photo would have needed a third number. Measuring the block means the
  // sheet is exactly as tall as what it has to show, whatever that is.
  const peekRef = useRef(null)
  const [peekHeight, setPeekHeight] = useState(null)
  useLayoutEffect(() => {
    const el = peekRef.current
    if (!el) return
    const measure = () => setPeekHeight(el.getBoundingClientRect().height)
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [p.id, lang])

  const viewportCap = typeof window !== 'undefined' ? window.innerHeight - 68 : EXPANDED
  const collapsed = Math.round(Math.min((peekHeight ?? 150) + CHROME, viewportCap))
  const sheet = useSheetDrag([collapsed, Math.min(EXPANDED, viewportCap)], 0)
  const expanded = sheet.index === 1

  useEffect(() => { onHeightChange?.(sheet.height) }, [sheet.height, onHeightChange])

  const countdown = p.open
    ? tf('dateOpenYear', lang, { year: p.year })
    : isPast ? `${Math.abs(p.daysUntil)} ${t('daysAgo', lang)}`
    : p.daysUntil === 0 ? t('today', lang)
    : p.daysUntil === 1 ? t('tomorrow', lang)
    : lang === 'de'
      ? `noch ${labelForDaysLong(p.daysUntil, 'de')}`
      : `${labelForDaysLong(p.daysUntil, 'en')} ${t('away', lang)}`

  const when = p.open
    ? (p.lastDate ? tf('lastHeld', lang, {
        year: p.lastDate.slice(0, 4),
        date: formatDate(p.lastDate, lang, { weekday: 'short', day: 'numeric', month: 'long' }),
      }) : '')
    : formatDate(p.date, lang, { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })

  const share = async () => {
    track('share')
    const url = `https://pridemap.net/${lang}/`
    try { await navigator.share({ title: p.name, url }) } catch { /* dismissed */ }
  }

  const rows = []
  if (p.startTime) rows.push([t('startTime', lang), p.startTime])
  if (p.meetingPoint) rows.push([t('meetingPoint', lang), p.meetingPoint])
  rows.push([t('place', lang), [p.region, COUNTRY_NAMES[p.country] ?? p.country].filter(Boolean).join(' · ')])
  rows.push([
    t('filterSize', lang),
    <>
      {t({ small: 'smallEvent', medium: 'mediumEvent', large: 'largeEvent' }[p.size] ?? p.size, lang)}
      {att && ` · ${fmtCount(att.count)} ${t('visitors', lang)}`}
      {att?.year && ` (${att.year}${att.by === 'authorities' ? `, ${t('sourceAuthorities', lang)}`
        : att.by === 'organizers' ? `, ${t('sourceOrganizers', lang)}` : ''})`}
      {att?.kind === 'unclear' && <span className="detail-flagword">{t('countUnclear', lang)}</span>}
    </>,
  ])
  if (p.firstYear) rows.push([t('established', lang), String(p.firstYear)])
  const statusKey = {
    announced: 'statusAnnounced', confirmed: 'statusConfirmed',
    cancelled: 'statusCancelled', unverified: 'statusUnverified',
  }[p.status]
  if (statusKey) rows.push([t('sourceLabel', lang), t(statusKey, lang)])

  return (
    <section
      className={`sheet detail-sheet ${sheet.dragging ? 'is-dragging' : ''}`}
      style={{ height: sheet.height }}
      aria-label={city}
    >
      <button
        type="button"
        className="sheet-grab"
        aria-label={city}
        aria-expanded={expanded}
        {...sheet.handlers}
      >
        <span className="sheet-grab-bar" />
      </button>
      <button type="button" className="detail-x" onClick={onClose} aria-label={t('close', lang)}>
        <X size={16} />
      </button>

      <div className="sheet-scroll detail-scroll">
        <div ref={peekRef} className="detail-peek">
        <h2 className="detail-head">
          {isFirstTime(p) && <span className="detail-premiere">{t('firstTime', lang)} {p.year}</span>}
          <span className="detail-city" style={{ color }}>{city}</span>
          <span className={`${flag(p.country)} detail-flag`} />
          {p.name !== city && <span className="detail-name">{p.name}</span>}
        </h2>

        <p className="detail-when">
          <span style={{ color: p.open || isPast ? undefined : color }}>{countdown}</span>
          {when && <span className="detail-date"> · {when}</span>}
        </p>

        {/* Either there is a photo or short video for this Pride, or the
            block is simply not there — no reserved space, no placeholder. The
            measurement above picks up whichever case applies. */}
        {p.media && <DetailMedia media={p.media} name={p.name} />}

        <div className="detail-actions">
          {p.lat != null && (
            <a
              className="act act-primary"
              href={routeUrl(p)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track('route')}
            >
              <Navigation size={14} aria-hidden="true" />{t('route', lang)}
            </a>
          )}
          {!p.open && !isPast && (
            <button type="button" className="act" onClick={() => { track('calendar'); downloadICS(p) }}>
              <CalendarPlus size={14} aria-hidden="true" />{t('calendar', lang)}
            </button>
          )}
          <button type="button" className="act" onClick={share}>
            <Share2 size={14} aria-hidden="true" />{t('share', lang)}
          </button>
        </div>

        {(p.website || p.instagram) && (
          <p className="detail-links-row">
            {p.website && (
              <a href={p.website} target="_blank" rel="noopener noreferrer">
                <Globe size={13} aria-hidden="true" />
                {p.website.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]} ↗
              </a>
            )}
            {p.instagram && (
              <a href={p.instagram} target="_blank" rel="noopener noreferrer">
                <InstagramIcon size={13} />
                @{p.instagram.replace(/^https?:\/\/(www\.)?instagram\.com\//, '').replace(/\/$/, '')} ↗
              </a>
            )}
          </p>
        )}
        </div>

        {expanded && (
          <div className="detail-extra">
            <dl className="detail-rows">
              {rows.map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>

            {p.queerIndex != null && (
              <div className="detail-index">
                <div className="index-label">
                  <span>{t('ilgaIndex', lang)}</span>
                  <span style={{ color: indexColor(p.queerIndex) }}>
                    {p.queerIndex}% · {indexLabelL10n(p.queerIndex, lang)}
                  </span>
                </div>
                <div
                  className="index-bar-track"
                  role="meter"
                  aria-valuenow={p.queerIndex}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={t('ilgaIndex', lang)}
                >
                  <div
                    className="index-bar-fill"
                    style={{ transform: `scaleX(${p.queerIndex / 100})`, background: indexColor(p.queerIndex) }}
                  />
                </div>
              </div>
            )}

            {p.source?.url && (
              <p className="detail-source">
                {t('sourceLabel', lang)}:{' '}
                <a href={p.source.url} target="_blank" rel="noopener noreferrer">
                  {p.source.url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]} ↗
                </a>
                {p.source.checked && ` · ${tf('checkedOn', lang, { date: formatDate(p.source.checked, lang) })}`}
              </p>
            )}

            <p className="detail-report">
              <a href="https://forms.gle/oo6vk3QfANXskXku8" target="_blank" rel="noopener noreferrer">
                {t('reportError', lang)} ↗
              </a>
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
