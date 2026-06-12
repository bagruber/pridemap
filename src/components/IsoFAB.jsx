import { useState } from 'react'
import { Route } from 'lucide-react'
import { ISO_BANDS } from '../config/isoBands.js'
import { useLang } from '../contexts/LangContext.jsx'
import { t } from '../utils/i18n.js'

export default function IsoFAB({
  isoOrigin, onOriginSet,
  isoMode, onModeChange,
  isoPinning, onPinningChange,
}) {
  const { lang } = useLang()
  const [open, setOpen] = useState(false)
  const isActive = !!isoOrigin

  const handleSetOrigin = () => {
    if (isoOrigin) {
      onOriginSet(null)
    } else {
      onPinningChange(v => !v)
      setOpen(false)
    }
  }

  return (
    <>
      <button
        className={`iso-fab ${isActive ? 'active' : ''}`}
        onClick={() => setOpen(v => !v)}
        aria-label="Travel time"
      >
        <Route size={18} />
        {isActive && <span className="iso-fab-dot" />}
      </button>

      {open && (
        <div className="iso-fab-panel">
          <div className="iso-fab-title">
            {t('isoTravelTime', lang)} <span className="iso-beta">beta</span>
          </div>
          <div className="iso-mode-row">
            {[
              { value: 'driving-car',      labelKey: 'isoCar' },
              { value: 'cycling-regular',  labelKey: 'isoCycling' },
            ].map(m => (
              <button
                key={m.value}
                className={`toggle-btn ${isoMode === m.value ? 'active' : ''}`}
                onClick={() => onModeChange(m.value)}
              >
                {t(m.labelKey, lang)}
              </button>
            ))}
          </div>
          <button
            className={`iso-pin-btn ${isoPinning ? 'pinning' : ''}`}
            onClick={handleSetOrigin}
          >
            {isoOrigin
              ? t('isoClearOrigin', lang)
              : isoPinning
                ? t('isoClickMap', lang)
                : t('isoSetOrigin', lang)}
          </button>
          {isActive && (
            <div className="iso-legend">
              {[...ISO_BANDS].reverse().map(b => (
                <div key={b.seconds} className="iso-legend-item">
                  <div className="iso-legend-swatch" style={{ background: b.stroke.replace('0.5)', '0.55)') }} />
                  <span>{b.seconds / 60} {t('isoMin', lang)}</span>
                </div>
              ))}
            </div>
          )}
          <a
            className="iso-here-attr"
            href="https://www.here.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            Powered by HERE
          </a>
        </div>
      )}
    </>
  )
}
