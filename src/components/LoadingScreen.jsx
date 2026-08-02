import { useEffect, useState } from 'react'
import Logo from './Logo.jsx'

// Stays mounted through its own fade so the circles don't vanish mid-animation
export default function LoadingScreen({ done }) {
  const [gone, setGone] = useState(false)

  useEffect(() => {
    if (!done) return
    const id = setTimeout(() => setGone(true), 420)
    return () => clearTimeout(id)
  }, [done])

  if (gone) return null

  return (
    <div className={`loading-screen ${done ? 'is-done' : ''}`} role="status" aria-label="Loading">
      <Logo size={128} animated />
    </div>
  )
}
