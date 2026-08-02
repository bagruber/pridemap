// Writes public/logo.svg from the same definition the app renders, so the
// static asset can never drift from the component.
//
//   node scripts/logo-svg.mjs
import fs from 'fs'
import { CIRCLES, VIEWBOX, intersections } from '../src/config/logo.js'

const circle = (c, fill) =>
  `<circle cx="${c.cx}" cy="${c.cy}" r="${c.r}" fill="${fill}"/>`

const clips = CIRCLES
  .map(c => `    <clipPath id="c-${c.id}"><circle cx="${c.cx}" cy="${c.cy}" r="${c.r}"/></clipPath>`)
  .join('\n')

const bases = CIRCLES.map(c => `  ${circle(c, c.color)}`).join('\n')

const regions = intersections().map(r => {
  const open = r.clip.map(c => `<g clip-path="url(#c-${c.id})">`).join('')
  const close = r.clip.map(() => '</g>').join('')
  return `  ${open}${circle(r.shape, r.color)}${close}`
}).join('\n')

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${VIEWBOX}" width="512" height="512" role="img" aria-label="Pride Map">
  <defs>
${clips}
  </defs>
${bases}
${regions}
</svg>
`

fs.writeFileSync('./public/logo.svg', svg)
console.log(`Logo: public/logo.svg written (${CIRCLES.length} circles, ${intersections().length} overlap regions).`)
