#!/usr/bin/env bash
set -euo pipefail

# ==========================================
# CONFIGURATION
# ==========================================
PROJECT_NAME="${PROJECT_NAME:-webspatial-quickstart-ci-app}"
WORK_DIR="/tmp/webspatial-ci-tests"
PROJECT_DIR="${WORK_DIR}/${PROJECT_NAME}"
# Grab the absolute path to our new template directory
TEMPLATE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/template"

mkdir -p "${WORK_DIR}"
DEV_PID=""
XR_DEV_PID=""

cleanup() {
  echo "Cleaning up background servers..."
  if [[ -n "${DEV_PID}" ]] && kill -0 "${DEV_PID}" 2>/dev/null; then kill "${DEV_PID}" || true; fi
  if [[ -n "${XR_DEV_PID}" ]] && kill -0 "${XR_DEV_PID}" 2>/dev/null; then kill "${XR_DEV_PID}" || true; fi
}
trap cleanup EXIT

# ==========================================
# SCAFFOLDING & DEPENDENCIES
# ==========================================
echo "Step 1: Scaffolding Vite React + TS..."
rm -rf "${PROJECT_DIR}"
cd "${WORK_DIR}"
yes '' | pnpm dlx create-vite@latest "${PROJECT_NAME}" --template react-ts || true
cd "${PROJECT_DIR}"

touch pnpm-workspace.yaml
echo "ignore-scripts=false" > .npmrc

echo "Step 2: Installing SDKs and forcing React dependencies..."
pnpm install

# Added react and react-dom explicitly just in case create-vite missed them
pnpm add react react-dom @webspatial/react-sdk @webspatial/core-sdk @google/model-viewer three

# Added @vitejs/plugin-react explicitly so your vite.config.ts never crashes again
pnpm add -D @vitejs/plugin-react @webspatial/builder @webspatial/platform-visionos @webspatial/vite-plugin

# ==========================================
# 📝 COPYING TEMPLATE FILES
# ==========================================
echo "✍Step 3: Copying WebSpatial template files..."
# This recursively copies everything from our template folder directly into the new project
cp -R "${TEMPLATE_DIR}/"* "${PROJECT_DIR}/"

# ==========================================
# SERVER HEALTH CHECKS
# ==========================================
wait_for_http() {
  local url="$1"; local desc="$2"; local log="$3"
  echo "⏳ Waiting for ${desc} at ${url}..."

  for ((i = 1; i <= 30; i++)); do
    HTTP_CODE=$(curl -sL -o /dev/null -w "%{http_code}" --max-time 3 "${url}" || echo "FAILED")
    if [[ "${HTTP_CODE}" == "200" || "${HTTP_CODE}" == "304" ]]; then
      echo "✅ ${desc} is up!"
      return 0
    fi
    sleep 2
    if [[ -n "${DEV_PID}" ]] && ! kill -0 "${DEV_PID}" 2>/dev/null; then echo "❌ ${desc} crashed."; cat "${log}"; return 1; fi
    if [[ -n "${XR_DEV_PID}" ]] && ! kill -0 "${XR_DEV_PID}" 2>/dev/null; then echo "❌ ${desc} crashed."; cat "${log}"; return 1; fi
  done
  echo "❌ Timed out waiting for ${desc}."
  return 1
}

echo "Step 4: Starting Dev Servers..."

# 1. Standard Web Server
pnpm exec vite --port 5173 > dev-5173.log 2>&1 &
DEV_PID=$!
if ! wait_for_http "http://127.0.0.1:5173/" "Standard Dev Server" "dev-5173.log"; then exit 1; fi

# 2. WebSpatial XR Server
XR_ENV=avp pnpm exec vite --port 5175 > dev-5175.log 2>&1 &
XR_DEV_PID=$!
XR_BASE_URL="http://127.0.0.1:5175/webspatial/avp/"
if ! wait_for_http "${XR_BASE_URL}" "XR Dev Server" "dev-5175.log"; then exit 1; fi

# ==========================================
# 🥽 SIMULATOR LAUNCH
# ==========================================
echo "🥽 Step 5: Launching WebSpatial Builder..."

if [[ "$(uname -s)" == "Darwin" && "${WEBSPATIAL_RUN_BUILDER:-0}" == "1" ]]; then
  echo "Sending build to Simulator at ${XR_BASE_URL}..."
  pnpm exec webspatial-builder run --base="${XR_BASE_URL}"
  echo "Success! Look in your simulator."
else
  echo "⏩ Skipping Simulator (Not macOS or WEBSPATIAL_RUN_BUILDER != 1)."
fi

echo "✅ All checks passed."