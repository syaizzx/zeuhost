#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo "=============================================="
echo "  ZeuHost Turnkey VPS Setup & Installer"
echo "  Open Source Bot Hosting Platform by Zeuzz"
echo "=============================================="

cd "$ROOT_DIR"

# 1. Run Pre-flight Checks
"$SCRIPT_DIR/preflight.sh"

# 2. Setup Environment Variables
ENV_FILE="$ROOT_DIR/deploy/.env"
if [ ! -f "$ENV_FILE" ]; then
  echo "[+] Generating production deploy/.env from template..."
  cp "$ROOT_DIR/deploy/.env.example" "$ENV_FILE"

  # Generate random cryptographic secrets
  AUTH_SECRET=$(openssl rand -hex 32)
  HMAC_SECRET=$(openssl rand -hex 32)
  ENCRYPT_KEY=$(openssl rand -hex 32)
  DB_PASS=$(openssl rand -hex 16)

  sed -i "s/CHANGE_ME_AUTH_SECRET_MIN_32_CHARS/$AUTH_SECRET/g" "$ENV_FILE"
  sed -i "s/CHANGE_ME_HMAC_SECRET_FOR_CONTROL_CHANNEL/$HMAC_SECRET/g" "$ENV_FILE"
  sed -i "s/CHANGE_ME_64_HEX_CHARACTERS_FOR_AES_256_GCM_ENCRYPTION/$ENCRYPT_KEY/g" "$ENV_FILE"
  sed -i "s/CHANGE_ME_DB_PASSWORD/$DB_PASS/g" "$ENV_FILE"

  echo "[+] Generated random keys for BETTER_AUTH_SECRET, HMAC, and INSTANCE_SECRET_KEY."
else
  echo "[+] Found existing deploy/.env configuration."
fi

# 3. Pull / Build Containers
echo "[+] Building and launching ZeuHost services via Docker Compose..."
docker compose -f "$ROOT_DIR/deploy/docker-compose.yml" --env-file "$ENV_FILE" up -d --build

echo "[+] Waiting for PostgreSQL database to be healthy..."
sleep 5

# 4. Run Prisma Database Migrations
echo "[+] Applying database migrations..."
docker compose -f "$ROOT_DIR/deploy/docker-compose.yml" exec -T web bun run --cwd packages/db migrate:deploy || true

echo "=============================================="
echo "  ZeuHost Installation Complete!"
echo "  Web Interface: http://localhost:80 (or your configured domain)"
echo "  To bootstrap the Owner account, run:"
echo "  ./scripts/create-owner.sh --email admin@yourdomain.com"
echo "=============================================="
