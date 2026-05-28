import { useEffect } from 'react'
import { X } from 'lucide-react'
import { useLang } from '../contexts/LangContext.jsx'
import { t } from '../utils/i18n.js'

export default function AboutDialog({ open, onClose }) {
  const { lang } = useLang()

  useEffect(() => {
    if (!open) return
    const onKey = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="about-backdrop" onClick={onClose}>
      <div className="about-dialog" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
        <button className="about-close" onClick={onClose} aria-label={t('close', lang)}>
          <X size={16} />
        </button>
        <h2 className="about-title">{t('about', lang)}</h2>
        <p className="about-text">{t('aboutText', lang)}</p>
        <p className="about-text about-text-muted">{t('disclaimer', lang)}</p>
        <p className="about-credit">By Benedict Arya Gruber</p>
      </div>
    </div>
  )
}
