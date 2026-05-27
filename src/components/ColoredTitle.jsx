const PRIDE_COLORS = ['#E40303', '#FF8C00', '#FFED00', '#008026', '#004DFF', '#750787']

export default function ColoredTitle({ className = 'app-title' }) {
  let n = 0
  const chars = [...'pride map 2026'].map((ch, i) => {
    if (ch === ' ') return <span key={i}> </span>
    const color = PRIDE_COLORS[Math.floor(n++ / 2)]
    return <span key={i} style={{ color }}>{ch}</span>
  })
  return <h1 className={className} aria-label="pride map 2026">{chars}</h1>
}
