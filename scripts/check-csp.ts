import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'
import { findCspViolations, formatViolations } from './csp-guard.ts'

/**
 * Standalone form of the build gate, for checking an artifact that was not just
 * built with this config — e.g. a zip that is about to be uploaded.
 *
 *   npm run check:csp                    # scans .output
 *   node scripts/check-csp.ts some/dir
 */

const dir = resolve(process.argv[2] ?? '.output')

if (!existsSync(dir)) {
  console.error(`CSP guard: ${dir} does not exist`)
  process.exit(1)
}

const violations = await findCspViolations(dir)

if (violations.length) {
  console.error(formatViolations(dir, violations))
  process.exit(1)
}

console.log(`✔ CSP guard: ${dir} is clean`)
