import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { LangProvider } from './contexts/LangContext.jsx'
import 'flag-icons/css/flag-icons.min.css'
import './styles/main.css'

// Inject @font-face using the runtime base URL so fonts resolve correctly
// regardless of whether the app is served from /pridemap/ or /
;(function () {
  const base = import.meta.env.BASE_URL
  const s = document.createElement('style')
  s.textContent = `
@font-face {
  font-family: 'Gilbert';
  src: url('${base}fonts/GilbertColorBold.otf') format('opentype');
  font-weight: 700; font-style: normal;
}
@font-face {
  font-family: 'GilbertFallback';
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
