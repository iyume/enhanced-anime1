import { defineConfig } from 'wxt'

// Two things matter for this repro:
//   manifestVersion: 3 — MV3 content scripts share `script-src 'self'`, with no
//     'unsafe-eval'. That is what turns a reachable eval/Function into a hard failure.
//   no `global` shim of our own — bare lodash is the whole point.
export default defineConfig({
  manifestVersion: 3,
  manifest: {
    name: 'wxt-lodash-csp-repro',
    description: 'Minimal repro: wxt version vs. Firefox content-script CSP',
  },
})
