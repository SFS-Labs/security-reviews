#!/usr/bin/env bash
# SFS REA toolchain. Pin upstream releases and verify third-party binaries.
# This installs into the current ephemeral runner, not the GitHub account.
set -euo pipefail

profile="${1:-core}"
case "$profile" in core|android|native|all) ;; *) echo "Unknown profile: $profile" >&2; exit 2 ;; esac

node -e '
  const [maj,min,patch] = process.versions.node.split(".").map(Number);
  const ok = (maj===22 && (min>23 || min===23 && patch>=4))
          || (maj===24 && (min>22 || min===22 && patch>=1))
          || (maj===26 && (min>12 || min===12 && patch>=1));
  if (!ok) { console.error("REA requires Node >=22.23.4 (22.x), >=24.22.1 (24.x), or >=26.12.1 (26.x)"); process.exit(1); }
'
command -v npm >/dev/null
command -v ps >/dev/null  # required by REA's Linux owned-process checks

readonly REA_VERSION="6.8.0"
npm install --global --no-audit --no-fund "rea-agents@${REA_VERSION}"
rea --version
rea capabilities --json >/dev/null

if [[ "$profile" == core ]]; then
  echo "Core REA CLI installed; licensed decompilers and optional engines are not included."
  exit 0
fi

command -v java >/dev/null || { echo "JDK 21 required for optional engines" >&2; exit 1; }
command -v javac >/dev/null || { echo "Full JDK required (not JRE)" >&2; exit 1; }

readonly install_root="${RUNNER_TEMP:-${HOME}/.cache/sfs-rea}/sfs-rea"
mkdir -p "$install_root"

persist_env() {
  local k="$1" v="$2"
  export "$k=$v"
  if [[ -n "${GITHUB_ENV:-}" ]]; then
    printf '%s=%s\n' "$k" "$v" >> "$GITHUB_ENV"
  fi
}

download_verified() {
  local url="$1" digest="$2" target="$3"
  if [[ ! -f "$target" ]] || ! printf '%s  %s\n' "$digest" "$target" | sha256sum --check --status; then
    rm -f -- "$target"
    curl --fail --location --show-error --silent --retry 2 --max-time 900 "$url" --output "$target"
    printf '%s  %s\n' "$digest" "$target" | sha256sum --check
  fi
}

if [[ "$profile" == android || "$profile" == all ]]; then
  readonly jar="$install_root/jadx-headless-mcp-0.7.1-all.jar"
  download_verified \
    "https://github.com/1013503897/jadx-headless-mcp/releases/download/v0.7.1/jadx-headless-mcp-0.7.1-all.jar" \
    "6e5eacf500b64292bfb73c49797c1958f6ee44646e43e868039ae7feb573ff75" \
    "$jar"
  persist_env REA_JADX_MCP_JAR "$jar"
  rea doctor --provider jadx --json > "$install_root/jadx-doctor.json"
  echo "JADX readiness diagnostics: $install_root/jadx-doctor.json"
fi

if [[ "$profile" == native || "$profile" == all ]]; then
  readonly zip="$install_root/ghidra_12.1.4_PUBLIC_20260921.zip"
  readonly ghidra="$install_root/ghidra_12.1.4_PUBLIC"
  download_verified \
    "https://github.com/NationalSecurityAgency/ghidra/releases/download/Ghidra_12.1.4_build/ghidra_12.1.4_PUBLIC_20260921.zip" \
    "ddac49f903da9d5bac833e5cc79395098b9c33cfd3279be5f31bd00387d2d4db" \
    "$zip"
  if [[ ! -f "$ghidra/support/analyzeHeadless" ]]; then
    unzip -q "$zip" -d "$install_root"
  fi
  [[ -f "$ghidra/support/analyzeHeadless" ]] || { echo "Ghidra extraction failed" >&2; exit 1; }
  persist_env GHIDRA_INSTALL_DIR "$ghidra"
  persist_env GHIDRA_HEADLESS_MAXMEM "1536M"
  rea doctor --provider ghidra --json > "$install_root/ghidra-doctor.json"
  echo "Ghidra readiness diagnostics: $install_root/ghidra-doctor.json"
fi

browser="$(command -v google-chrome || command -v chromium || true)"
if [[ -n "$browser" ]]; then
  persist_env REA_BROWSER_EXECUTABLE "$browser"
  echo "Chrome-family browser available: $browser"
else
  echo "No Chrome-family browser detected. Web runtime inspection needs a browser." >&2
fi
echo "Prerequisite checks complete. Run a target-specific analysis to establish real operational readiness."
