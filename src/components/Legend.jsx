import { TIME_BUCKETS, PAST_COLOR } from '../utils/timeColors.js'

export default function Legend() {
  return (
    <div className="legend">
      <div className="legend-title">Days until</div>
      {TIME_BUCKETS.map(b => (
        <div key={b.label} className="legend-item">
          <div className="legend-dot" style={{ background: b.color }} />
          <span>{b.label}</span>
        </div>
      ))}
      <div className="legend-item">
        <div className="legend-dot" style={{ background: PAST_COLOR }} />
        <span>Past</span>
      </div>

      <hr className="legend-divider" />
      <div className="legend-title">Event size</div>
      {[
        { label: 'Small', d: 8 },
        { label: 'Medium', d: 14 },
        { label: 'Large', d: 22 },
      ].map(s => (
        <div key={s.label} className="legend-size-row">
          <div
            className="legend-size-dot"
            style={{ width: s.d, height: s.d }}
          />
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.label}</span>
        </div>
      ))}
    </div>
  )
}
