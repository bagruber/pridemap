import { createContext, useContext, useState } from 'react'

const LangContext = createContext('en')

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('pridemap-lang') ?? 'en')

  const toggle = () => {
    const next = lang === 'en' ? 'de' : 'en'
    localStorage.setItem('pridemap-lang', next)
    setLang(next)
  }

  return (
    <LangContext.Provider value={{ lang, toggle }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  return useContext(LangContext)
}
