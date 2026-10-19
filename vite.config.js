import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { season } from './src/utils/season.js'

// The season goes into index.html at build time (Vite replaces %VITE_…% there)
// so the title and the meta tags carry it without a literal anywhere in the
// markup. October's build is what turns the page over to the next year.
process.env.VITE_SEASON = String(season())

export default defineConfig({
  plugins: [react()],
  base: '/pridemap/',
})
