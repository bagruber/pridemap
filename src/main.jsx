import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { LangProvider } from './contexts/LangContext.jsx'
import '@fontsource/sofia-sans/400.css'
import '@fontsource/sofia-sans/400-italic.css'
import '@fontsource/sofia-sans/600.css'
import '@fontsource/sofia-sans/700.css'
import 'flag-icons/css/flag-icons.min.css'
import './styles/main.css'

// Inject @font-face using the runtime base URL so fonts resolve correctly
// regardless of whether the app is served from /pridemap/ or /.
//
// The outline cut, not the colour one: the wordmark's colours come from the
// per-letter spans in ColoredTitle, and the two render pixel for pixel the
// same. GilbertColorBold was 626 kB against 87 kB for this.
;(function () {
  const base = import.meta.env.BASE_URL
  const s = document.createElement('style')
  s.textContent = `
@font-face {
  font-family: 'Gilbert';
  src: url('${base}fonts/GilbertBold.otf') format('opentype');
  font-weight: 700; font-style: normal;
}`
  document.head.insertBefore(s, document.head.firstChild)
})()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LangProvider>
      <App />
    </LangProvider>
  </React.StrictMode>,
)
