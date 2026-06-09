import { createContext, useContext, useState, useEffect } from 'react'

const LangContext = createContext('en')

const META = {
  en: {
    title: 'Pride Map 2026 — European LGBTQ+ Pride Calendar',
    description: 'Interactive map and calendar of 600+ LGBTQ+ Pride parades across Europe in 2026. Filter by country, size and date. Available in English and German.',
  },
  de: {
    title: 'Pride Map 2026 — Europäischer LGBTQ+ Pride-Kalender',
    description: 'Interaktive Karte mit 600+ LGBTQ+ Pride-Paraden und CSD-Terminen in Europa 2026. Nach Land, Größe und Datum filtern. Regenbogenparaden auf einen Blick.',
  },
}

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(() => localStorage.getItem('pridemap-lang') ?? 'en')

  useEffect(() => {
    const m = META[lang] ?? META.en
    document.documentElement.lang = lang
    document.title = m.title
    document.querySelector('meta[name="description"]')?.setAttribute('content', m.description)
  }, [lang])

  const setLang = (l) => {
    localStorage.setItem('pridemap-lang', l)
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
