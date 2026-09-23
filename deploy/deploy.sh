#!/usr/bin/env bash
# Deploy web + API to the cPanel subdomain gbps.reddevils.co.in
# Usage:
#   SSH_KEY=~/.ssh/cpanel-deploy ./deploy/deploy.sh
# Prereqs (one time, see deploy/cpanel.md): subdomain exists, DB imported,
# backend/config.local.php placed on the server, noreply@gbps.reddevils.co.in exists.
set -euo pipefail

HOST="${CPANEL_HOST:-kaveri.domainadda.com}"
USER="${CPANEL_USER:-reddevil}"
KEY="${SSH_KEY:-$HOME/.ssh/cpanel-deploy}"
REMOTE_DIR="${CPANEL_DIR:-/home/reddevil/public_html/gbps.reddevils.co.in}"

if [ ! -f "$KEY" ]; then
  echo "SSH key not found: $KEY (set SSH_KEY=...)" >&2
  exit 1
fi

SSH="ssh -i $KEY -o StrictHostKeyChecking=accept-new"
RSYNC="rsync -avz --delete -e \"$SSH\""

npm run build

# 1. Web (dist/) — exclude server-only files
# shellcheck disable=SC2086
eval $RSYNC dist/ "$USER@$HOST:$REMOTE_DIR/" \
  --exclude 'config.local.php'

# 2. API + routing
scp -i "$KEY" backend/api.php "$USER@$HOST:$REMOTE_DIR/api/index.php"
scp -i "$KEY" backend/htaccess-api.txt "$USER@$HOST:$REMOTE_DIR/api/.htaccess"
scp -i "$KEY" deploy/htaccess-spa.txt "$USER@$HOST:$REMOTE_DIR/.htaccess"

# 3. Writable uploads dir
$SSH "$USER@$HOST" "mkdir -p $REMOTE_DIR/uploads $REMOTE_DIR/api && chmod 755 $REMOTE_DIR/uploads"

echo "Deployed to https://gbps.reddevils.co.in"
$SSH "$USER@$HOST" "php -l $REMOTE_DIR/api/index.php"
