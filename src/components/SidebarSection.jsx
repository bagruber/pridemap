import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

/**
 * A collapsible block in the desktop sidebar.
 *
 * The legend and the travel-time controls used to float over the map's right
 * edge, which is exactly where the detail column now lives. They fold into the
 * sidebar instead, closed by default: neither is something you look at while
 * scanning the map.
 */
export default function SidebarSection({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className={`side-section ${open ? 'is-open' : ''}`}>
      <button
        type="button"
        className="side-section-head"
        aria-expanded={open}
        onClick={() => setOpen(v => !v)}
      >
        <span>{title}</span>
        <ChevronDown size={14} aria-hidden="true" />
      </button>
      {open && <div className="side-section-body">{children}</div>}
    </div>
  )
}
