import { createContext, useContext, useState, useEffect } from 'react'
import { season } from '../utils/season.js'

const LangContext = createContext('en')

const YEAR = season()

const META = {
  en: {
    title: `Pride Map ${YEAR} — European LGBTQ+ Pride Calendar`,
    description: `Interactive map and calendar of 600+ LGBTQ+ Pride parades across Europe in ${YEAR}. Filter by country, size and date. Available in English and German.`,
  },
  de: {
    title: `Pride Map ${YEAR} — Europäischer LGBTQ+ Pride-Kalender`,
    description: `Interaktive Karte mit 600+ LGBTQ+ Pride-Paraden und CSD-Terminen in Europa ${YEAR}. Nach Land, Größe und Datum filtern. Regenbogenparaden auf einen Blick.`,
  },
}

// Without a stored choice, follow the browser. Starting in English for someone
// with a German browser was a decision nobody made.
function initialLang() {
  try {
    const stored = localStorage.getItem('pridemap-lang')
    if (stored === 'de' || stored === 'en') return stored
  } catch { /* private mode */ }
  return navigator.language?.toLowerCase().startsWith('de') ? 'de' : 'en'
}

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(initialLang)

  useEffect(() => {
    const m = META[lang] ?? META.en
    document.documentElement.lang = lang
    document.title = m.title
    document.querySelector('meta[name="description"]')?.setAttribute('content', m.description)
  }, [lang])

  const setLang = (l) => {
    try { localStorage.setItem('pridemap-lang', l) } catch { /* private mode */ }
    setLangState(l)
  }

  const toggle = () => setLang(lang === 'en' ? 'de' : 'en')

  return (
    <LangContext.Provider value={{ lang, toggle, setLang }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  return useContext(LangContext)
}
