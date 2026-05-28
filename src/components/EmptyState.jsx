import { SearchX } from 'lucide-react'

export default function EmptyState({ title, action, actionLabel }) {
  return (
    <div className="empty-state">
      <SearchX size={32} strokeWidth={1.5} />
      <div className="empty-state-text">{title}</div>
      {action && (
        <button className="empty-state-action" onClick={action}>
          {actionLabel}
        </button>
      )}
    </div>
  )
}
