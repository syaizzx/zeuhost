#!/usr/bin/env bash
set -euo pipefail

EMAIL=""
NAME="Operator Owner"
PASSWORD=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --email)
      EMAIL="$2"
      shift 2
      ;;
    --name)
      NAME="$2"
      shift 2
      ;;
    --password)
      PASSWORD="$2"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1"
      exit 1
      ;;
  esac
done

if [ -z "$EMAIL" ]; then
  read -rp "Enter Owner Email: " EMAIL
fi

if [ -z "$PASSWORD" ]; then
  read -s -rp "Enter Owner Password (min 12 chars): " PASSWORD
  echo ""
fi

if [ "${#PASSWORD}" -lt 12 ]; then
  echo "[-] Error: Password must be at least 12 characters."
  exit 1
fi

echo "[+] Bootstrapping Owner account: $EMAIL ($NAME)..."

# Execute database insertion via Prisma / PostgreSQL container
docker exec -i zeuhost-postgres psql -U "${POSTGRES_USER:-zeuhost}" -d "${POSTGRES_DB:-zeuhost}" <<SQL
INSERT INTO "User" (id, email, name, role, status, "emailVerified", "createdAt", "updatedAt")
VALUES (
  'owner_' || substr(md5(random()::text), 1, 16),
  '${EMAIL}',
  '${NAME}',
  'OWNER',
  'ACTIVE',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET role = 'OWNER', status = 'ACTIVE';
SQL

echo "[+] Owner account bootstrapped successfully for $EMAIL!"
