#!/usr/bin/env bash
# =============================================================================
#  ZeuHost Automatic 1-Command VPS Installer
#  Created by syaizzx - https://github.com/syaizzx/zeuhost
# =============================================================================

set -euo pipefail

# Text formatting
BOLD='\033[1m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}${BOLD}"
cat << "EOF"
  _____            _    _           _   
 |__  /___ _   _  | |  | | ___  ___| |_ 
   / // _ \ | | | | |__| |/ _ \/ __| __|
  / /|  __/ |_| | |  __  | (_) \__ \ |_ 
 /____\___|\__,_| |_|  |_|\___/|___/\__|
  Open-Source White-Label Bot Hosting Platform
EOF
echo -e "${NC}"

# 1. Root Privileges Check
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}[-] Error: Installer ini harus dijalankan sebagai root atau dengan sudo.${NC}"
  echo "Silakan jalankan ulang: sudo bash install.sh atau sudo su"
  exit 1
fi

# 2. Determine Installation Directory
INSTALL_DIR="/opt/zeuhost"
if [ -f "./deploy/docker-compose.yml" ] && [ -d "./packages" ]; then
  # Running from within an existing clone
  INSTALL_DIR="$(pwd)"
  echo -e "${BLUE}[*] Menggunakan direktori saat ini: ${INSTALL_DIR}${NC}"
else
  # Running via curl | bash
  echo -e "${BLUE}[*] Menginstall ZeuHost ke ${INSTALL_DIR}...${NC}"
  mkdir -p "$INSTALL_DIR"
fi

# 3. Install System Dependencies if missing
echo -e "\n${BLUE}[1/6] Memeriksa paket sistem dasar (curl, git, openssl, jq)...${NC}"
MISSING_PKGS=()
for pkg in curl git openssl jq ufw; do
  if ! command -v "$pkg" &>/dev/null; then
    MISSING_PKGS+=("$pkg")
  fi
done

if [ ${#MISSING_PKGS[@]} -gt 0 ]; then
  echo -e "${YELLOW}[+] Menginstall paket yang dibutuhkan: ${MISSING_PKGS[*]}...${NC}"
  apt-get update -qq && apt-get install -y -qq "${MISSING_PKGS[@]}" 2>/dev/null || true
fi

# 4. Check & Install Docker Engine
echo -e "\n${BLUE}[2/6] Memeriksa Docker Engine & Docker Compose v2...${NC}"
if ! command -v docker &>/dev/null; then
  echo -e "${YELLOW}[+] Docker belum terpasang. Menginstall Docker CE resmi otomatis...${NC}"
  curl -fsSL https://get.docker.com | sh
  systemctl enable --now docker 2>/dev/null || true
  echo -e "${GREEN}[+] Docker CE berhasil terpasang.${NC}"
fi

# Ensure Docker daemon is actively running
if ! docker info &>/dev/null; then
  echo -e "${YELLOW}[+] Menyalakan Docker daemon...${NC}"
  systemctl start docker 2>/dev/null || service docker start 2>/dev/null || true
fi

# 4b. Check & Install Docker Compose v2 (Bulletproof: tries apt then falls back to official binary)
if ! docker compose version &>/dev/null; then
  echo -e "${YELLOW}[+] Menginstall Docker Compose v2...${NC}"

  # Attempt apt install first (silently ignore if repo lacks package)
  apt-get update -qq && apt-get install -y -qq docker-compose-plugin 2>/dev/null || true

  # If still not available via apt, download official standalone binary from GitHub releases
  if ! docker compose version &>/dev/null; then
    echo -e "${YELLOW}[+] Mengunduh biner resmi Docker Compose v2 dari GitHub...${NC}"
    ARCH=$(uname -m)
    case "$ARCH" in
      x86_64)        COMPOSE_ARCH="x86_64" ;;
      aarch64|arm64) COMPOSE_ARCH="aarch64" ;;
      armv7l)        COMPOSE_ARCH="armv7" ;;
      *)             COMPOSE_ARCH="x86_64" ;;
    esac

    # Create standard docker CLI plugin directories
    mkdir -p /usr/local/lib/docker/cli-plugins /usr/lib/docker/cli-plugins

    COMPOSE_URL="https://github.com/docker/compose/releases/latest/download/docker-compose-linux-${COMPOSE_ARCH}"
    curl -sSL "$COMPOSE_URL" -o /usr/local/lib/docker/cli-plugins/docker-compose
    chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

    # Create symlinks for universal CLI support
    ln -sf /usr/local/lib/docker/cli-plugins/docker-compose /usr/lib/docker/cli-plugins/docker-compose 2>/dev/null || true
    ln -sf /usr/local/lib/docker/cli-plugins/docker-compose /usr/local/bin/docker-compose 2>/dev/null || true
  fi
fi

if ! docker compose version &>/dev/null; then
  echo -e "${RED}[-] Error: Gagal memasang Docker Compose v2. Silakan periksa koneksi internet VPS.${NC}"
  exit 1
fi

echo -e "${GREEN}[+] Docker: $(docker --version | awk '{print $3}' | tr -d ',') | Compose: $(docker compose version --short)${NC}"

# 5. Clone Repository if not present
if [ ! -f "$INSTALL_DIR/deploy/docker-compose.yml" ]; then
  echo -e "\n${BLUE}[3/6] Mengunduh source code ZeuHost dari GitHub...${NC}"
  git clone --depth 1 https://github.com/syaizzx/zeuhost.git "$INSTALL_DIR"
fi

cd "$INSTALL_DIR"

# Detect Public IP
SERVER_IP=$(curl -s --max-time 3 https://api.ipify.org || curl -s --max-time 3 https://ifconfig.me || echo "127.0.0.1")

# 6. Interactive Prompts (with sensible defaults)
echo -e "\n${BLUE}[4/6] Konfigurasi Domain & Akun Admin Operator...${NC}"

# Domain prompt
if [ -z "${HOST_DOMAIN:-}" ]; then
  read -rp "Masukkan Domain / Subdomain Anda (atau tekan Enter untuk IP: $SERVER_IP): " INPUT_DOMAIN
  DOMAIN="${INPUT_DOMAIN:-$SERVER_IP}"
else
  DOMAIN="$HOST_DOMAIN"
fi

# Email prompt
if [ -z "${ADMIN_EMAIL:-}" ]; then
  read -rp "Masukkan Email Admin / Operator [admin@$DOMAIN]: " INPUT_EMAIL
  EMAIL="${INPUT_EMAIL:-admin@$DOMAIN}"
else
  EMAIL="$ADMIN_EMAIL"
fi

# Password prompt
if [ -z "${ADMIN_PASSWORD:-}" ]; then
  DEFAULT_PASS=$(openssl rand -hex 6)
  read -rp "Masukkan Password Admin (atau tekan Enter untuk random: $DEFAULT_PASS): " INPUT_PASS
  PASSWORD="${INPUT_PASS:-$DEFAULT_PASS}"
else
  PASSWORD="$ADMIN_PASSWORD"
fi

# Determine Protocol
if [ "$DOMAIN" = "$SERVER_IP" ] || [ "$DOMAIN" = "localhost" ] || [ "$DOMAIN" = "127.0.0.1" ]; then
  PUBLIC_URL="http://${DOMAIN}"
else
  PUBLIC_URL="https://${DOMAIN}"
fi

# 7. Generate Environment Secrets
echo -e "\n${BLUE}[5/6] Mengenerate kunci keamanan & konfigurasi .env...${NC}"
ENV_FILE="$INSTALL_DIR/deploy/.env"
cp "$INSTALL_DIR/deploy/.env.example" "$ENV_FILE"

AUTH_SECRET=$(openssl rand -hex 32)
HMAC_SECRET=$(openssl rand -hex 32)
ENCRYPT_KEY=$(openssl rand -hex 32)
DB_PASS=$(openssl rand -hex 16)

# Update .env
sed -i "s|HOST_DOMAIN=.*|HOST_DOMAIN=${DOMAIN}|g" "$ENV_FILE"
sed -i "s|PUBLIC_URL=.*|PUBLIC_URL=${PUBLIC_URL}|g" "$ENV_FILE"
sed -i "s|CHANGE_ME_DB_PASSWORD|${DB_PASS}|g" "$ENV_FILE"
sed -i "s|CHANGE_ME_AUTH_SECRET_MIN_32_CHARS|${AUTH_SECRET}|g" "$ENV_FILE"
sed -i "s|CHANGE_ME_HMAC_SECRET_FOR_CONTROL_CHANNEL|${HMAC_SECRET}|g" "$ENV_FILE"
sed -i "s|CHANGE_ME_64_HEX_CHARACTERS_FOR_AES_256_GCM_ENCRYPTION|${ENCRYPT_KEY}|g" "$ENV_FILE"

# Configure Firewall
if command -v ufw &>/dev/null && ufw status | grep -q "Status: active"; then
  echo -e "${YELLOW}[+] Mengizinkan port HTTP/HTTPS pada UFW Firewall...${NC}"
  ufw allow 80/tcp >/dev/null 2>&1 || true
  ufw allow 443/tcp >/dev/null 2>&1 || true
fi

# 8. Launch Services via Docker Compose
echo -e "\n${BLUE}[6/6] Menjalankan seluruh container ZeuHost (Caddy, Web, Runtime, PostgreSQL)...${NC}"
docker compose -f "$INSTALL_DIR/deploy/docker-compose.yml" --env-file "$ENV_FILE" up -d --build

echo -e "${BLUE}[*] Menunggu database PostgreSQL siap...${NC}"
sleep 6

# Apply database migrations & seed initial plans & templates
echo -e "${BLUE}[*] Menerapkan migrasi database dan seeding template resmi...${NC}"
docker compose -f "$INSTALL_DIR/deploy/docker-compose.yml" exec -T web bun run --cwd packages/db migrate:deploy || docker compose -f "$INSTALL_DIR/deploy/docker-compose.yml" exec -T web bun run --cwd packages/db db:push || true
docker compose -f "$INSTALL_DIR/deploy/docker-compose.yml" exec -T web bun run --cwd packages/db seed || true

# Bootstrap Admin Owner Account in PostgreSQL
echo -e "${BLUE}[*] Membuat akun Owner Operator...${NC}"
docker compose -f "$INSTALL_DIR/deploy/docker-compose.yml" exec -T postgres psql -U zeuhost -d zeuhost >/dev/null 2>&1 <<SQL || true
INSERT INTO "User" (id, email, name, role, status, "emailVerified", "createdAt", "updatedAt")
VALUES (
  'owner_' || substr(md5(random()::text), 1, 16),
  '${EMAIL}',
  'Operator Utama',
  'OWNER',
  'ACTIVE',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET role = 'OWNER', status = 'ACTIVE';
SQL

# Final Summary Box
echo -e "\n${GREEN}${BOLD}================================================================${NC}"
echo -e "${GREEN}${BOLD}  ZeuHost Berhasil Terpasang & Aktif 24 Jam Non-Stop!${NC}"
echo -e "${GREEN}${BOLD}================================================================${NC}"
echo -e "  ${BOLD}URL Layanan:${NC}       ${PUBLIC_URL}"
echo -e "  ${BOLD}Panel Admin:${NC}       ${PUBLIC_URL}/admin"
echo -e "  ${BOLD}Panel Pelanggan:${NC}   ${PUBLIC_URL}/dashboard"
echo -e "  ${BOLD}Email Admin:${NC}       ${EMAIL}"
echo -e "  ${BOLD}Password Admin:${NC}    ${PASSWORD}"
echo -e "  ${BOLD}Lokasi File:${NC}       ${INSTALL_DIR}"
echo -e "${GREEN}================================================================${NC}"
echo -e "${YELLOW}Perintah Berguna:${NC}"
echo -e "  - Lihat Log:         cd ${INSTALL_DIR} && make docker-logs"
echo -e "  - Restart Service:   cd ${INSTALL_DIR} && make docker-up"
echo -e "  - Backup Database:   cd ${INSTALL_DIR} && ./scripts/backup.sh"
echo -e "${GREEN}================================================================${NC}\n"
