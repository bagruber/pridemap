import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { useLang } from '../contexts/LangContext.jsx'
import { t } from '../utils/i18n.js'

export default function AboutDialog({ open, onClose }) {
  const { lang } = useLang()
  const dialogRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const previouslyFocused = document.activeElement
    dialogRef.current?.querySelector('.about-close')?.focus()

    const onKey = e => {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key !== 'Tab' || !dialogRef.current) return
      // Keep Tab inside the dialog
      const focusables = dialogRef.current.querySelectorAll('button, a[href]')
      if (!focusables.length) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      previouslyFocused?.focus?.()
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="about-backdrop" onClick={onClose}>
      <div
        ref={dialogRef}
        className="about-dialog"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={t('about', lang)}
      >
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
