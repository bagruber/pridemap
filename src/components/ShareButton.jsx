import { useState } from 'react'
import { Share2 } from 'lucide-react'
import { useLang } from '../contexts/LangContext.jsx'
import { t } from '../utils/i18n.js'

export default function ShareButton({ className = '' }) {
  const { lang } = useLang()
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      try { await navigator.share({ title: 'Pride Map 2026', url }); return } catch {}
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  return (
    <button className={`share-btn ${className}`} onClick={handleShare}>
      <Share2 size={13} />
      <span>{copied ? t('linkCopied', lang) : t('share', lang)}</span>
    </button>
  )
}
