#!/bin/bash
# Minimal repro: the same tiny wxt project + the same lodash, built with two wxt
# versions. Only the wxt version differs, and only one of the two bundles survives
# Firefox's content-script CSP.
#
# Needs: node, npm, and network access for the two installs. Takes a couple of minutes.
# Nothing here touches the repository working tree — everything lands in $TMP.
#
#   bash reproduce.sh [temp-dir]
#
# Then, to check the result against what is committed here:
#   node sandbox-sim.mjs <temp-dir>      # evaluates both bundles under a Firefox model
#   node verify.mjs <temp-dir>           # re-checks every fingerprint and byte slice

set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
TMP="${1:-${TMPDIR:-/tmp}/wxt-lodash-csp-repro}"
OLD_WXT=0.20.7    # what enhanced-anime1 v1.0.1 shipped with
NEW_WXT=0.20.27   # what v1.1.0 shipped with — the release that broke

echo "== building the repro in $TMP =="
rm -rf "$TMP" && mkdir -p "$TMP"
cp -r "$HERE/repro" "$TMP/old"
cp -r "$HERE/repro" "$TMP/new"

# The single variable: the wxt version, installed exactly. Everything else — vite,
# and with it rollup or rolldown — is whatever that wxt brings along.
echo "== installing wxt@$OLD_WXT and building old/ =="
(cd "$TMP/old" && npm i -D "wxt@$OLD_WXT" --silent --no-audit --no-fund && npx wxt build -b firefox)
echo "== installing wxt@$NEW_WXT and building new/ =="
(cd "$TMP/new" && npm i -D "wxt@$NEW_WXT" --silent --no-audit --no-fund && npx wxt build -b firefox)

# ---------------------------------------------------------------------------
# What each wxt version actually resolved to, and the two bundles' fingerprints.
# ---------------------------------------------------------------------------
echo
node --input-type=commonjs -e '
const fs = require("node:fs"), crypto = require("node:crypto"), cp = require("node:child_process")
const T = process.argv[1]
const ver = (d, p) => {
  try { return JSON.parse(fs.readFileSync(`${T}/${d}/node_modules/${p}/package.json`, "utf8")).version }
  catch { return "-" }
}

console.log("resolved".padEnd(22), "wxt".padEnd(9), "vite".padEnd(9), "rollup".padEnd(9), "rolldown".padEnd(9), "lodash")
for (const d of ["old", "new"])
  console.log(d.padEnd(22), ...[ "wxt", "vite", "rollup", "rolldown", "lodash" ].map(p => ver(d, p).padEnd(9)))

console.log("")
for (const d of ["old", "new"]) {
  const f = `${T}/${d}/.output/firefox-mv3/content-scripts/content.js`
  const s = fs.readFileSync(f, "utf8"), buf = fs.readFileSync(f)
  const sha = crypto.createHash("sha256").update(buf).digest("hex")
  const shim = s.indexOf("typeof globalThis<\"u\"?globalThis") >= 0
  const bound = s.match(/typeof (\w+)==[`"'"'"']object[`"'"'"']&&\1&&\1\.Object===Object&&\1/)?.[1]
  console.log(
    d.padEnd(5),
    String(buf.length).padStart(6), "bytes ",
    sha.slice(0, 16) + "…",
    " freeGlobal → " + String(bound).padEnd(7),
    " global shim:", shim ? "PRESENT" : "absent",
  )
}
' "$TMP"

cat <<'EXPECTED'

Expected — same source, same lodash, only the wxt version differs
  old   wxt 0.20.7   vite 6.x + rollup     shim PRESENT  freeGlobal → the shim   <- survives
  new   wxt 0.20.27  vite 8.x + rolldown   shim absent   freeGlobal → `global`  <- dies

`Function(` is in both bundles. In the old one it is simply unreachable: `||` never
evaluates its third operand while the first is truthy. Reaching it is what Firefox
refuses, and only the new toolchain reaches it.

Next:
  node sandbox-sim.mjs "<tmp>"   -> the new bundle throws EvalError: call to Function()
                                    blocked by CSP; the old one initialises
  node verify.mjs    "<tmp>"     -> fingerprints and committed byte slices still match
EXPECTED
