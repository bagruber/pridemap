import { useLang } from '../contexts/LangContext.jsx'
import { tf } from '../utils/i18n.js'
import { season } from '../utils/season.js'

const PRIDE_COLORS = ['#E40303', '#FF8C00', '#FFED00', '#008026', '#004DFF', '#750787']
const WORDMARK = 'pride map'

// The name carries no year any more — the season does, on its own line. That
// way the turn of the year is data, not a string to hunt down in the code.
export default function ColoredTitle({ className = 'app-title', today }) {
  const { lang } = useLang()
  // Spread the six flag colours over however many letters there are, so the
  // wordmark keeps the whole flag — dropping the year left it ending at green.
  const letters = [...WORDMARK].filter(ch => ch !== ' ').length
  let n = 0
  const chars = [...WORDMARK].map((ch, i) => {
    if (ch === ' ') return <span key={i}> </span>
    const color = PRIDE_COLORS[Math.min(
      PRIDE_COLORS.length - 1,
      Math.floor((n++ * PRIDE_COLORS.length) / letters),
    )]
    return <span key={i} style={{ color }}>{ch}</span>
  })
  return (
    <div className="wordmark">
      <h1 className={className} aria-label={WORDMARK}>{chars}</h1>
      <div className="wordmark-season">{tf('seasonLabel', lang, { year: season(today) })}</div>
    </div>
  )
}
