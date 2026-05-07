#!/usr/bin/env bash
# Run once on a fresh server to install dependencies and clone the repo.
# Usage: curl the raw file and pipe to bash, or scp it over and run manually.
set -euo pipefail

REPO_DIR="${REPO_DIR:-/opt/attio-whatsapp-crm-os}"
APP_DIR="${APP_DIR:-${REPO_DIR}/apps/attio}"
REPO_URL="${REPO_URL:-git@github.com:itsanishjain/attio-whatsapp-crm-os.git}"
BRANCH="${BRANCH:-main}"

export DEBIAN_FRONTEND=noninteractive

echo "--- Installing system dependencies ---"
apt-get update
apt-get install -y ca-certificates curl git gnupg

echo "--- Installing Docker ---"
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
. /etc/os-release
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu ${VERSION_CODENAME} stable" \
  > /etc/apt/sources.list.d/docker.list
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

echo "--- Cloning repo ---"
mkdir -p "$(dirname "${REPO_DIR}")"
git clone --branch "${BRANCH}" "${REPO_URL}" "${REPO_DIR}"

echo "--- Done. Now:"
echo "  1. Copy .env.production into ${APP_DIR}/.env.production"
echo "  2. Run: ${APP_DIR}/scripts/server-deploy.sh"
