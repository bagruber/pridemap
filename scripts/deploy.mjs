// Publishes dist/ to a branch.
//
//   node scripts/deploy.mjs <branch>
//
// Replaces the `gh-pages` package, which passes every tracked file to
// `git rm` as a separate argument. Since the prerenderer started emitting
// ~1400 pages plus ~640 images that argument list exceeds the Windows
// 32k command-line limit and the deploy dies with ENAMETOOLONG. Staging
// with `git add -A` instead keeps the argument list constant regardless
// of how many files the build produces.
import { execFileSync } from 'child_process'
import fs from 'fs'
import path from 'path'

const branch = process.argv[2]
if (!branch) {
  console.error('Usage: node scripts/deploy.mjs <branch>')
  process.exit(1)
}

const DIST = path.resolve('dist')
const WORK = path.resolve('node_modules/.cache/deploy', branch)

if (!fs.existsSync(path.join(DIST, 'index.html'))) {
  console.error('dist/index.html missing — build first.')
  process.exit(1)
}

const git = (args, cwd) =>
  execFileSync('git', args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] }).toString().trim()

const remote = git(['remote', 'get-url', 'origin'], process.cwd())
const sourceSha = git(['rev-parse', '--short', 'HEAD'], process.cwd())

// Fresh shallow checkout of the target branch (or a new orphan branch)
fs.rmSync(WORK, { recursive: true, force: true })
fs.mkdirSync(WORK, { recursive: true })
git(['init', '-q'], WORK)
git(['remote', 'add', 'origin', remote], WORK)

let exists = true
try {
  git(['fetch', '-q', '--depth', '1', 'origin', branch], WORK)
} catch {
  exists = false
}

if (exists) {
  git(['checkout', '-q', '-B', branch, 'FETCH_HEAD'], WORK)
  // Clear the tree; `git add -A` below records the deletions
  for (const entry of fs.readdirSync(WORK)) {
    if (entry === '.git') continue
    fs.rmSync(path.join(WORK, entry), { recursive: true, force: true })
  }
} else {
  git(['checkout', '-q', '--orphan', branch], WORK)
}

fs.cpSync(DIST, WORK, { recursive: true })

git(['add', '-A'], WORK)

const status = git(['status', '--porcelain'], WORK)
if (!status) {
  console.log(`Deploy: ${branch} already up to date, nothing to push.`)
  process.exit(0)
}

const fileCount = status.split('\n').length
git(['-c', 'user.name=deploy', '-c', 'user.email=deploy@local',
     'commit', '-q', '-m', `Deploy ${sourceSha}`], WORK)
git(['push', '-q', '--force', 'origin', branch], WORK)

console.log(`Deploy: pushed ${fileCount} changed paths to ${branch} (from ${sourceSha}).`)
