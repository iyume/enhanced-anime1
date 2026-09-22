// Checks every fingerprint README.md claims, against the bundles reproduce.sh built and
// against what is actually committed on this branch. Exits non-zero on any mismatch.
//
//   node verify.mjs <temp-root> [ref]
//
// Expected values come from expected.json; `ref` defaults to the branch this evidence
// lives on, falling back to HEAD.

import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const T = process.argv[2]
if (!T) throw new Error('usage: node verify.mjs <temp-root>')

const EXPECTED = JSON.parse(fs.readFileSync(path.join(HERE, 'expected.json'), 'utf8'))
const DIR = path.basename(HERE) // this directory, relative to the repo root

const ref = process.argv[3] ?? [DIR, 'HEAD'].find(r => {
  try { execFileSync('git', ['rev-parse', '--verify', '--quiet', r], { cwd: HERE }); return true }
  catch { return false }
})

let bad = 0
const say = (ok, msg) => { if (!ok) bad++; console.log(`${ok ? ' ok ' : 'FAIL'}  ${msg}`) }

for (const k of ['old', 'new']) {
  const e = EXPECTED[k]
  const file = `${T}/${k}/.output/firefox-mv3/content-scripts/content.js`
  if (!fs.existsSync(file)) { say(false, `${k}: ${file} not found — run reproduce.sh first`); continue }

  const buf = fs.readFileSync(file)
  const sha = crypto.createHash('sha256').update(buf).digest('hex')
  const s = buf.toString('utf8')

  say(buf.length === e.bytes, `${k}: ${buf.length} bytes (expected ${e.bytes})`)
  say(sha === e.sha256, `${k}: sha256 ${sha.slice(0, 16)}… (expected ${e.sha256.slice(0, 16)}…)`)

  const at = s.indexOf('Function(')
  say(at === e.functionAt, `${k}: first \`Function(\` @ ${at} (expected ${e.functionAt})`)

  const shim = /typeof globalThis<["']u["']\?globalThis/.test(s)
  say(shim === e.shim, `${k}: global shim ${shim ? 'PRESENT' : 'absent'} (expected ${e.shim ? 'PRESENT' : 'absent'})`)

  // The committed slice must (a) carry this build's fingerprint and (b) be a verbatim
  // substring of it, modulo the interleaved `//` commentary.
  const slice = fs.readFileSync(path.join(HERE, 'bundler-diff', `${k}-wxt.js`), 'utf8')
  say(slice.includes(`bytes    : ${buf.length}`), `${k}: slice header carries the byte count`)
  say(slice.includes(`sha256   : ${sha}`), `${k}: slice header carries the sha256`)
  say(slice.includes(`byte ${e.functionAt}`), `${k}: slice header carries the \`Function(\` offset`)
  for (const [i, section] of slice.split(/^### /m).slice(1).entries()) {
    const body = section.split('\n').slice(1).filter(l => !l.startsWith('//')).join('\n').trim()
    say(body.length > 0 && s.includes(body), `${k}: slice section ${i + 1} appears verbatim in the build`)
  }
}

// lodash's _root.js, the source of the idiom — the reason a lodash import is what
// triggers this at all.
const rootSha = crypto.createHash('sha256')
  .update(fs.readFileSync(path.join(HERE, 'bundler-diff/lodash-_root.js'))).digest('hex')
say(rootSha === '32ea714f25057679fdd3099c2693cb6be437252e78eea3a5a7882a1282078348',
  `bundler-diff/lodash-_root.js sha256 ${rootSha.slice(0, 16)}…`)

// Every stored blob must equal the file on disk, i.e. the `* -text` in .gitattributes
// really did stop git from rewriting the slices' bytes on the way in.
for (const rel of ['bundler-diff/old-wxt.js', 'bundler-diff/new-wxt.js',
  'bundler-diff/lodash-_root.js', 'bundler-diff/make-slices.mjs', 'expected.json']) {
  let blob
  try {
    blob = execFileSync('git', ['show', `${ref}:${DIR}/${rel}`], { cwd: HERE, maxBuffer: 1 << 28 })
  }
  catch (err) { say(false, `${rel}: not on ${ref} (${err.message.split('\n')[0]})`); continue }
  const disk = fs.readFileSync(path.join(HERE, rel))
  say(blob.equals(disk), `${rel}: committed blob on ${ref} == file on disk (${disk.length} B)`)
}

console.log(bad === 0 ? '\nall claims verified' : `\n${bad} CLAIM(S) FAILED`)
process.exit(bad === 0 ? 0 : 1)
