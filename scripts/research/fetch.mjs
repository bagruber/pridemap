// One polite request per source and run: an honest User-Agent, robots.txt
// respected, no retries. The overview pages are other people's work, mostly
// run by volunteers or small shops; we read them the way a person would.

export const USER_AGENT = 'pridemap-recherche/1.0 (+https://pridemap.net)'
const AGENT_TOKEN = 'pridemap-recherche'

// robots.txt patterns: `*` is any run of characters, a trailing `$` anchors the
// end, everything else is a literal prefix
function toRegex(pattern) {
  const anchored = pattern.endsWith('$')
  const body = (anchored ? pattern.slice(0, -1) : pattern)
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')
  return new RegExp('^' + body + (anchored ? '$' : ''))
}

/**
 * Whether robots.txt lets us fetch `path`. The group naming our agent wins
 * over `*`; within a group the longest matching rule decides, Allow on a tie.
 */
export function robotsAllows(robotsTxt, path, agent = AGENT_TOKEN) {
  const groups = []
  let current = null
  let lastWasAgent = false
  for (const raw of (robotsTxt ?? '').split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, '').trim()
    const m = line.match(/^([A-Za-z-]+)\s*:\s*(.*)$/)
    if (!m) continue
    const key = m[1].toLowerCase(), value = m[2].trim()
    if (key === 'user-agent') {
      if (!lastWasAgent) { current = { agents: [], rules: [] }; groups.push(current) }
      current.agents.push(value.toLowerCase())
      lastWasAgent = true
    } else {
      lastWasAgent = false
      if (current && (key === 'allow' || key === 'disallow') && value) {
        current.rules.push({ allow: key === 'allow', pattern: value })
      }
    }
  }
  const own = groups.filter(g => g.agents.some(a => a !== '*' && agent.toLowerCase().includes(a)))
  const rules = (own.length ? own : groups.filter(g => g.agents.includes('*'))).flatMap(g => g.rules)

  let best = null
  for (const r of rules) {
    if (!toRegex(r.pattern).test(path)) continue
    if (!best || r.pattern.length > best.pattern.length ||
        (r.pattern.length === best.pattern.length && r.allow)) best = r
  }
  return best ? best.allow : true
}

export async function politeFetch(url) {
  const u = new URL(url)
  const headers = { 'User-Agent': USER_AGENT, 'Accept-Language': 'de,en;q=0.8' }
  const robots = await fetch(`${u.origin}/robots.txt`, { headers, signal: AbortSignal.timeout(15_000) })
    .then(r => (r.ok ? r.text() : ''))
    .catch(() => '')
  if (!robotsAllows(robots, u.pathname + u.search)) {
    throw new Error(`robots.txt von ${u.host} sperrt ${u.pathname}${u.search} — nicht abgerufen`)
  }
  const res = await fetch(url, { headers, redirect: 'follow', signal: AbortSignal.timeout(30_000) })
  if (!res.ok) {
    const err = new Error(`${url}: HTTP ${res.status}`)
    err.status = res.status
    throw err
  }
  return res.text()
}
