import { SearchX } from 'lucide-react'

export default function EmptyState({ title, action, actionLabel, linkHref, linkLabel, showIcon = true }) {
  return (
    <div className="empty-state">
      {showIcon && <SearchX size={32} strokeWidth={1.5} />}
      <div className="empty-state-text">{title}</div>
      {action && (
        <button className="empty-state-action" onClick={action}>
          {actionLabel}
        </button>
      )}
      {linkHref && (
        <a className="empty-state-action" href={linkHref} target="_blank" rel="noopener noreferrer">
          {linkLabel}
        </a>
      )}
    </div>
  )
}
