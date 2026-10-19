import { ISO_BANDS } from '../config/isoBands.js'
import { useLang } from '../contexts/LangContext.jsx'
import { t } from '../utils/i18n.js'
import { track } from '../utils/track.js'

const MODES = [
  { value: 'driving-car', labelKey: 'isoCar' },
  { value: 'cycling-regular', labelKey: 'isoCycling' },
]

/**
 * Travel-time controls, in one place. This existed twice — inline in App.jsx
 * for the desktop panel and again inside the mobile FAB — with the two copies
 * already drifting in wording and behaviour.
 */
export default function IsoControls({
  isoOrigin, onOriginSet, isoMode, onModeChange, isoPinning, onPinningChange,
}) {
  const { lang } = useLang()

  const setOrigin = () => {
    if (isoOrigin) { onOriginSet(null); return }
    track('travel-time')
    onPinningChange(v => !v)
  }

  return (
    <div className="iso-controls">
      <div className="iso-title">
        {t('isoTravelTime', lang)} <span className="iso-beta">beta</span>
      </div>
      <div className="iso-mode-row">
        {MODES.map(m => (
          <button
            key={m.value}
            type="button"
            className={`toggle-btn ${isoMode === m.value ? 'active' : ''}`}
            onClick={() => onModeChange(m.value)}
          >
            {t(m.labelKey, lang)}
          </button>
        ))}
      </div>
      <button
        type="button"
        className={`iso-pin-btn ${isoPinning ? 'pinning' : ''}`}
        onClick={setOrigin}
      >
        {isoOrigin ? t('isoClearOrigin', lang)
          : isoPinning ? t('isoClickMap', lang)
          : t('isoSetOrigin', lang)}
      </button>
      {isoOrigin && (
        <div className="iso-legend">
          {[...ISO_BANDS].reverse().map(b => (
            <div key={b.seconds} className="iso-legend-item">
              <div className="iso-legend-swatch" style={{ background: b.stroke.replace('0.5)', '0.55)') }} />
              <span>{b.seconds / 60} {t('isoMin', lang)}</span>
            </div>
          ))}
        </div>
      )}
      <a className="iso-here-attr" href="https://www.here.com" target="_blank" rel="noopener noreferrer">
        Powered by HERE
      </a>
    </div>
  )
}
