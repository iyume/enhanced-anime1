// Answers "does this bundle survive a Firefox content script?" without launching Firefox.
//
//   node sandbox-sim.mjs <temp-root>
//
// It pulls the verbatim freeGlobal/freeSelf/Function chain out of each built content
// script and evaluates that exact sub-expression inside a model of the Firefox
// content-script sandbox:
//
//   globalThis  the sandbox's own global — this is what the Vite 6 shim binds to
//   global      not present (the sandbox global has no `global`)
//   self        found on the prototype: the page window, i.e. a different realm, so
//               self.Object !== Object  (an Xray wrapper; Bugzilla 1523139, WONTFIX)
//   Function    throws, the way the MV3 extension CSP blocks it
//
// This is a model, not Firefox. It encodes the realm split that Firefox's
// ExtensionContent.sys.mjs creates; the bundles and the slices are the real artifacts,
// and the original failure is recorded verbatim in symptom/firefox-console.txt.

import fs from 'node:fs'
import vm from 'node:vm'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const T = process.argv[2]
if (!T) throw new Error('usage: node sandbox-sim.mjs <temp-root>')

// The assignment of freeGlobal, through the `Function('return this')()` fallback: the
// three lines of lodash/_root.js this all comes down to, as emitted. The leading
// `[\w$]+=` matters — freeGlobal's target is a variable of its own, and the root
// assignment further along reads it back.
const CHAIN = /[\w$]+=typeof \w+==[`"']object[`"']&&\w+&&\w+\.Object===Object&&\w+/
const CALL = /Function\([^)]*\)\(\)/
const SHIM = /var \w+=typeof globalThis<"u"\?globalThis(?::typeof \w+<"u"\?\w+)*:\{\}/

function extract(bundle) {
  const s = fs.readFileSync(bundle, 'utf8')
  const chainAt = s.search(CHAIN)
  const call = s.slice(chainAt).match(CALL)
  const chain = s.slice(chainAt, chainAt + call.index + call[0].length)

  // Plus the shim statement when the bundler emitted one — in the Vite 6 build
  // freeGlobal's *operand* is that shim variable, so it has to come along.
  const shim = s.match(SHIM)
  return { code: shim ? `${shim[0]};\n${chain}` : chain, hasShim: shim !== null }
}

// A cross-realm stand-in for the Xray-wrapped page window: `Object` is a different
// function than the sandbox's own, so `self.Object === Object` is false there.
function makeSandbox() {
  const pageRealm = vm.createContext({})
  const foreignObject = vm.runInContext('Object', pageRealm)
  const sandbox = { self: { Object: foreignObject, window: {} }, console }
  const ctx = vm.createContext(sandbox)
  ctx.Function = () => { throw new EvalError('call to Function() blocked by CSP') }
  return ctx
}

// Expected: the old bundle initialises, the new one dies exactly the way Firefox died.
const VARIANTS = [
  { label: 'wxt 0.20.7  (Vite 6 + rollup)  ', dir: 'old', survives: true },
  { label: 'wxt 0.20.27 (Vite 8 + rolldown)', dir: 'new', survives: false },
]

let bad = 0
for (const v of VARIANTS) {
  const bundle = `${T}/${v.dir}/.output/firefox-mv3/content-scripts/content.js`
  const { code, hasShim } = extract(bundle)
  let verdict, survived
  try {
    const root = vm.runInContext(code, makeSandbox())
    survived = true
    verdict = `root = ${Object.prototype.toString.call(root)} — Function() not reached`
  }
  catch (err) {
    survived = false
    verdict = `${err.name}: ${err.message}`
  }
  const ok = survived === v.survives
  if (!ok) bad++
  console.log(`${ok ? ' ok ' : 'FAIL'}  ${v.label}  shim ${hasShim ? 'present' : 'absent '}  →  ${verdict}`)
}

console.log(bad === 0
  ? '\nReproduced: same lodash, same source, only the wxt version differs — and only the\nnew one dies under the Firefox content-script CSP.'
  : `\n${bad} variant(s) did not behave as expected — the repro does not reproduce.`)
