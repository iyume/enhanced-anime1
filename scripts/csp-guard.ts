import type { Plugin } from 'vite'
import { readdir, readFile } from 'node:fs/promises'
import { join, relative, resolve } from 'node:path'
import process from 'node:process'

/**
 * Quality gate for the one failure mode that is Firefox-only, runtime-only, and
 * silently fatal: MV3 content scripts share the extension CSP, which is
 * `script-src 'self'` — 'unsafe-eval' is not permitted in MV3 at all. So a bundle
 * that reaches `eval()` / `Function()` while its modules initialise makes Firefox
 * throw
 *
 *   EvalError: call to Function() blocked by CSP
 *
 * before `main()` runs, so the content script never loads.
 *
 * This shipped in 1.1.0, and it is worth recording why it was so easy to miss:
 * the offending code had been in the bundle and harmless for a year. lodash's
 * `_root.js` ends with `freeGlobal || freeSelf || Function('return this')()`.
 * Chrome never evaluates the third operand because `self.Object === Object` there.
 * Firefox was saved by the toolchain: Vite 6 + rollup rewrote the bare `global`
 * inside `freeGlobal` into an injected `globalThis`-or-window shim, which *is*
 * truthy in the content-script sandbox, so the `||` short-circuited. Vite 8 +
 * rolldown dropped that shim, both operands went falsy, and the `Function()`
 * fallback finally ran — same source, same lodash, broken release.
 *
 * The check is deliberately conservative: it fails on any occurrence, reachable or
 * not, because reachability is not tractable here and a silently broken Firefox
 * release costs far more than a false alarm. A flagged build is not automatically
 * wrong, but it does have to be looked at.
 *
 * See scripts/check-csp.ts for the standalone command.
 */

// Alternative considered: eslint's no-new-func/no-eval (already a devDep, AST-exact,
// so no polyfill lookbehind) — but a parse per file, and blind to JSON assets.

const RULES = [
  // `Function(...)`, `window.Function(...)`, but not `isFunction(`. esbuild leaves
  // this one a *direct* call, so lodash's `Function('return this')()` ships verbatim.
  { label: 'Function()', re: /(?<![\w$])Function\s*\(/g, files: /\.[mc]?js$/ },
  // An eval *call* — `eval(` — and the indirect form esbuild rewrites it into:
  // `(0,eval)("…")`, where `eval` is followed by `)` instead of `(`. So the `(` may
  // come after one closing paren. Bare `eval` is not enough: webextension-polyfill's
  // API metadata has `devtools:{inspectedWindow:{eval:{minArgs:1,…}}}` — a property
  // key, shipped in every build, which a bare-token rule would flag as a violation.
  { label: 'eval()', re: /(?<![\w$'"`])eval\s*(?:\)\s*)?\(/g, files: /\.[mc]?js$/ },
  // MV3 rejects this outright, and AMO will not accept it either
  { label: `'unsafe-eval'`, re: /unsafe-eval/g, files: /\.(json|[mc]?js)$/ },
]

export interface CspViolation {
  file: string
  label: string
  offset: number
  context: string
}

async function* walk(dir: string): AsyncGenerator<string> {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      // WXT's dev-server output (`<target>-dev`) is not a release artifact and
      // legitimately carries 'unsafe-eval' for its HMR sandbox
      if (entry.name.endsWith('-dev')) {
        continue
      }
      yield* walk(join(dir, entry.name))
    }
    else {
      yield join(dir, entry.name)
    }
  }
}

export async function findCspViolations(dir: string): Promise<CspViolation[]> {
  const violations: CspViolation[] = []
  for await (const file of walk(dir)) {
    const rules = RULES.filter(rule => rule.files.test(file))
    if (!rules.length) {
      continue
    }
    const source = await readFile(file, 'utf8')
    for (const { label, re } of rules) {
      re.lastIndex = 0
      let match = re.exec(source)
      while (match) {
        violations.push({
          file: relative(dir, file),
          label,
          offset: match.index,
          context: source.slice(Math.max(0, match.index - 60), match.index + 60),
        })
        match = re.exec(source)
      }
    }
  }
  return violations
}

export function formatViolations(dir: string, violations: CspViolation[]): string {
  return [
    `CSP guard: ${violations.length} forbidden pattern(s) under ${dir}`,
    `Firefox content scripts cannot use eval/Function under the MV3 extension CSP,`,
    `so shipping this would break the extension on Firefox only.`,
    '',
    ...violations.map(v => `  ${v.file} +${v.offset}  ${v.label}\n    ...${v.context}...`),
  ].join('\n')
}

// WXT runs several Vite builds into the same directory, each with its own
// plugin instance, so this is module-level: keep scanning on every pass (only
// the last sees the complete output) but report each directory once
const reported = new Set<string>()

/**
 * Fails the Vite build when the emitted bundle contains a pattern that Firefox
 * would refuse to run. Runs after the bundle is written and before `wxt zip`
 * packs it, so a rejected build never produces a release artifact.
 */
export function cspGuard(): Plugin {
  let outDir = ''
  return {
    name: 'enhanced-anime1:csp-guard',
    // Only gate real builds; the dev server output is not a release artifact
    apply: 'build',
    configResolved(config) {
      // Vite resolves `outDir` against `root`; `resolve` is a no-op once absolute
      outDir = resolve(config.root, config.build.outDir)
    },
    async closeBundle() {
      const violations = await findCspViolations(outDir)
      if (violations.length) {
        throw new Error(formatViolations(outDir, violations))
      }
      if (reported.has(outDir)) {
        return
      }
      reported.add(outDir)
      console.log(`✔ CSP guard: no eval/Function under ${relative(process.cwd(), outDir)}`)
    },
  }
}
