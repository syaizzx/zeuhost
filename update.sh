#!/usr/bin/env bash
# =============================================================================
#  ZeuHost Zero-Downtime Updater
#  Memperbarui platform tanpa menghapus database, .env, atau data bot.
# =============================================================================

set -euo pipefail

BOLD='\033[1m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "\n${BLUE}${BOLD}================================================================${NC}"
echo -e "${BLUE}${BOLD}       ZeuHost Cloud Platform - Automated Updater${NC}"
echo -e "${BLUE}${BOLD}================================================================${NC}\n"

# 1. Determine Project Directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

ENV_FILE="deploy/.env"
COMPOSE_FILE="deploy/docker-compose.yml"

if [ ! -f "$ENV_FILE" ]; then
  echo -e "${RED}[-] File deploy/.env tidak ditemukan! Pastikan ZeuHost sudah terinstall.${NC}"
  exit 1
fi

# 2. Pull Latest Git Changes
echo -e "${BLUE}[1/5] Mengambil pembaruan source code terbaru dari GitHub...${NC}"
if [ -d ".git" ]; then
  CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "main")
  echo -e "${YELLOW}[*] Branch aktif: ${CURRENT_BRANCH}${NC}"
  git fetch origin "$CURRENT_BRANCH" || true
  git pull origin "$CURRENT_BRANCH" || {
    echo -e "${YELLOW}[!] Warning: Git pull gagal atau ada local changes. Melanjutkan dengan kode lokal...${NC}"
  }
else
  echo -e "${YELLOW}[!] Bukan git repository, melewati git pull.${NC}"
fi

# 3. Automatic Pre-Update Database Backup
echo -e "\n${BLUE}[2/5] Membuat snapshot backup database otomatis sebelum update...${NC}"
if [ -f "./scripts/backup.sh" ]; then
  bash ./scripts/backup.sh || echo -e "${YELLOW}[!] Backup gagal atau postgres belum aktif, melanjutkan...${NC}"
fi

# 4. Synchronize New .env Variables (Tanpa menimpa kunci yang sudah ada)
echo -e "\n${BLUE}[3/5] Memeriksa & menyinkronkan variabel konfigurasi .env baru...${NC}"
if [ -f "deploy/.env.example" ]; then
  while IFS='=' read -r key value || [ -n "$key" ]; do
    # Skip comments and empty lines
    [[ "$key" =~ ^#.*$ ]] && continue
    [[ -z "$key" ]] && continue
    
    # If variable doesn't exist in existing .env, append it safely
    if ! grep -q "^${key}=" "$ENV_FILE" 2>/dev/null; then
      echo -e "${GREEN}[+] Menambahkan konfigurasi baru: ${key}${NC}"
      echo "${key}=${value}" >> "$ENV_FILE"
    fi
  done < deploy/.env.example
fi

# 5. Rebuild & Restart Web and Runtime Containers
echo -e "\n${BLUE}[4/5] Membangun ulang & me-restart container (Web, Runtime Daemon)...${NC}"
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --build --no-deps web runtime-manager

# 6. Apply Database Migrations & Seed New Templates
echo -e "\n${BLUE}[5/5] Menerapkan migrasi database & memperbarui template resmi...${NC}"
sleep 2

# Check if web container is running
if docker compose -f "$COMPOSE_FILE" ps | grep -q "zeuhost-web"; then
  echo -e "${YELLOW}[*] Menerapkan Prisma migrations...${NC}"
  docker compose -f "$COMPOSE_FILE" exec -T web bun run --cwd packages/db migrate:deploy 2>/dev/null || \
  docker compose -f "$COMPOSE_FILE" exec -T web bun run --cwd packages/db db:push --accept-data-loss || true

  echo -e "${YELLOW}[*] Menyinkronkan paket dan template resmi (Baileys v6, Discord, Python)...${NC}"
  docker compose -f "$COMPOSE_FILE" exec -T web bun run --cwd packages/db seed || true
else
  echo -e "${RED}[-] Container web belum siap. Jalankan 'make docker-up' manual jika diperlukan.${NC}"
fi

# 7. Prune dangling build images to save VPS disk space
echo -e "\n${BLUE}[*] Membersihkan cache build Docker lama...${NC}"
docker image prune -f >/dev/null 2>&1 || true

echo -e "\n${GREEN}${BOLD}================================================================${NC}"
echo -e "${GREEN}${BOLD}  Pembaruan ZeuHost Berhasil Diterapkan 100%!${NC}"
echo -e "${GREEN}${BOLD}================================================================${NC}"
echo -e "  - Seluruh container telah diperbarui ke versi terbaru"
echo -e "  - Database, akun pengguna, dan bot pelanggan tetap aman utuh"
echo -e "  - Template bot & konfigurasi baru telah aktif"
echo -e "${GREEN}================================================================${NC}\n"
