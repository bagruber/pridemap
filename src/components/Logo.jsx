import { CIRCLES, VIEWBOX, intersections } from '../config/logo.js'

const REGIONS = intersections()

// Every overlap is painted as its own opaque shape rather than relying on
// opacity or a blend mode, so the mark looks identical on the dark app, on a
// white favicon plate and inside a share image.
export default function Logo({
  size = 96,
  animated = false,
  stagger = 90,
  title,
  className = '',
}) {
  const delay = i => (animated ? { animationDelay: `${i * stagger}ms` } : undefined)

  return (
    <svg
      className={`logo ${animated ? 'logo-animated' : ''} ${className}`}
      viewBox={VIEWBOX}
      width={size}
      height={size}
      role={title ? 'img' : 'presentation'}
      aria-label={title}
      aria-hidden={title ? undefined : 'true'}
    >
      <defs>
        {CIRCLES.map(c => (
          <clipPath key={c.id} id={`logo-clip-${c.id}`}>
            <circle cx={c.cx} cy={c.cy} r={c.r} />
          </clipPath>
        ))}
      </defs>

      {CIRCLES.map((c, i) => (
        <circle
          key={c.id}
          className="logo-piece"
          cx={c.cx} cy={c.cy} r={c.r}
          fill={c.color}
          style={delay(i)}
        />
      ))}

      {REGIONS.map(region => {
        // Nested clips intersect, so a three-way overlap is two groups deep
        let node = (
          <circle
            className="logo-piece"
            cx={region.shape.cx} cy={region.shape.cy} r={region.shape.r}
            fill={region.color}
            style={delay(region.order)}
          />
        )
        for (let i = region.clip.length - 1; i >= 0; i--) {
          node = <g clipPath={`url(#logo-clip-${region.clip[i].id})`}>{node}</g>
        }
        return <g key={region.key}>{node}</g>
      })}
    </svg>
  )
}
