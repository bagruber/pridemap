// The mark: overlapping circles of different sizes, where every overlap shows
// a genuine mix of the colours underneath.
//
// Geometry is traced from the original raster logo, normalised to a 100×100
// box. Kept free of Vite-only globals so the build script can import it too.

// Warm circles cluster top-left, cool ones fill the lower right, and green
// bridges them. That separation is doing real work: mixing two near-opposite
// hues lands on magenta, so orange is kept clear of blue and indigo and only
// ever meets the cool side through green.
// Overlaps are sized to read as accents, not as the subject: each circle keeps
// roughly two thirds of its own colour, so the mark still scans as six hues
// rather than as one big mixed blob.
export const CIRCLES = [
  // Drawn in this order; later entries sit on top.
  { id: 'blue',   cx: 70, cy: 30, r: 21,   color: '#5880F8' },
  { id: 'indigo', cx: 68, cy: 60, r: 23,   color: '#6860F0' },
  { id: 'orange', cx: 27, cy: 34, r: 14,   color: '#F8A028' },
  { id: 'green',  cx: 38, cy: 53, r: 16,   color: '#68C068' },
  { id: 'red',    cx: 16, cy: 22, r: 9.5,  color: '#E84868' },
  { id: 'sky',    cx: 79, cy: 79, r: 11,   color: '#68B8F0' },
]

// ── Colour maths ─────────────────────────────────────────────────────────────
const toRgb = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16))
const toHex = rgb => '#' + rgb.map(v => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase()

function rgbToHsv([r, g, b]) {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min
  let h = 0
  if (d) {
    if (max === r) h = 60 * (((g - b) / d) % 6)
    else if (max === g) h = 60 * ((b - r) / d + 2)
    else h = 60 * ((r - g) / d + 4)
  }
  return [(h + 360) % 360, max ? d / max : 0, max]
}

function hsvToRgb([h, s, v]) {
  const c = v * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = v - c
  const [r, g, b] =
    h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x]
    : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x]
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255]
}

// Mixing in RGB turns complements into mud (orange over green would go olive).
// Mixing the hue on the shorter arc and keeping the stronger saturation and
// value instead reads as two coloured gels stacked on a lightbox: the overlap
// is a new hue, still vivid.
export function mixColors(a, b) {
  const [h1, s1, v1] = rgbToHsv(toRgb(a))
  const [h2, s2, v2] = rgbToHsv(toRgb(b))
  let delta = h2 - h1
  if (delta > 180) delta -= 360
  if (delta < -180) delta += 360
  const h = (h1 + delta / 2 + 360) % 360
  // Saturation takes the stronger of the two so the overlap stays vivid, but
  // brightness is averaged: taking the max there made every overlap lighter
  // than both parents, and the crossings ended up out-glowing the circles.
  return toHex(hsvToRgb([h, Math.max(s1, s2), (v1 + v2) / 2]))
}

const overlaps = (a, b) =>
  Math.hypot(a.cx - b.cx, a.cy - b.cy) < a.r + b.r

// Every intersection region, painted after the plain circles. Pairs first, then
// triples on top of them, so a three-way overlap reads deeper than a two-way.
export function intersections(circles = CIRCLES) {
  const pairs = []
  for (let i = 0; i < circles.length; i++) {
    for (let j = i + 1; j < circles.length; j++) {
      if (!overlaps(circles[i], circles[j])) continue
      pairs.push({
        key: `${circles[i].id}-${circles[j].id}`,
        clip: [circles[i]],
        shape: circles[j],
        // The painted shape is always the later circle, so an overlap can
        // animate in step with it and never appear before its own clip does.
        order: j,
        color: mixColors(circles[i].color, circles[j].color),
      })
    }
  }

  const triples = []
  for (let i = 0; i < circles.length; i++) {
    for (let j = i + 1; j < circles.length; j++) {
      for (let k = j + 1; k < circles.length; k++) {
        const [a, b, c] = [circles[i], circles[j], circles[k]]
        if (!overlaps(a, b) || !overlaps(a, c) || !overlaps(b, c)) continue
        triples.push({
          key: `${a.id}-${b.id}-${c.id}`,
          clip: [a, b],
          shape: c,
          order: k,
          color: mixColors(mixColors(a.color, b.color), c.color),
        })
      }
    }
  }
  return [...pairs, ...triples]
}

export const VIEWBOX = '0 0 100 100'
