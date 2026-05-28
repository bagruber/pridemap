import { useLang } from '../../contexts/LangContext.jsx'

export default function LangToggle() {
  const { lang, setLang } = useLang()
  return (
    <div className="lang-segmented">
      <button
        className={`toggle-btn ${lang === 'de' ? 'active' : ''}`}
        onClick={() => setLang('de')}
      >DE</button>
      <button
        className={`toggle-btn ${lang === 'en' ? 'active' : ''}`}
        onClick={() => setLang('en')}
      >EN</button>
    </div>
  )
}
