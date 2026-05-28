import { useEffect } from 'react'

export default function Toast({ message, onDismiss, duration = 3500 }) {
  useEffect(() => {
    if (!message) return
    const id = setTimeout(onDismiss, duration)
    return () => clearTimeout(id)
  }, [message, duration, onDismiss])

  if (!message) return null
  return (
    <div className="toast" role="status">{message}</div>
  )
}
