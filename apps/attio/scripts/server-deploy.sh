#!/usr/bin/env bash
# Called by CI on every push to main. Pulls latest code and rebuilds containers.
set -euo pipefail

REPO_DIR="${REPO_DIR:-/opt/attio-whatsapp-crm-os}"
APP_DIR="${APP_DIR:-${REPO_DIR}/apps/attio}"
BRANCH="${BRANCH:-main}"

if [[ ! -d "${REPO_DIR}/.git" ]]; then
  echo "Missing git repo at ${REPO_DIR}" >&2
  exit 1
fi

cd "${REPO_DIR}"

git config --global --add safe.directory "${REPO_DIR}" || true
git fetch origin "${BRANCH}"

if git show-ref --verify --quiet "refs/heads/${BRANCH}"; then
  git checkout "${BRANCH}"
else
  git checkout -b "${BRANCH}" "origin/${BRANCH}"
fi

git merge --ff-only "origin/${BRANCH}"

if [[ ! -f "${APP_DIR}/.env.production" ]]; then
  echo "Missing ${APP_DIR}/.env.production" >&2
  exit 1
fi

cd "${APP_DIR}"
if ! docker compose up -d --build --remove-orphans; then
  echo "--- docker compose ps ---" >&2
  docker compose ps >&2 || true
  echo "--- docker compose logs (last 120 lines) ---" >&2
  docker compose logs --tail=120 >&2 || true
  exit 1
fi
