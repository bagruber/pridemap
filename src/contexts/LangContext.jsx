import { createContext, useContext, useState } from 'react'

const LangContext = createContext('en')

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(() => localStorage.getItem('pridemap-lang') ?? 'en')

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
