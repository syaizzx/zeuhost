#!/usr/bin/env bash
set -euo pipefail

echo "=============================================="
echo "  ZeuHost Pre-Flight System Requirements Check"
echo "=============================================="

# 1. OS Check
OS="$(uname -s)"
if [ "$OS" != "Linux" ]; then
  echo "[-] Warning: Running on $OS. Linux is recommended for production deployments."
else
  echo "[+] Operating System: Linux ($(uname -r))"
fi

# 2. Docker Check
if ! command -v docker &> /dev/null; then
  echo "[-] Error: docker is not installed. Please install Docker 24.0+."
  exit 1
fi
DOCKER_VERSION=$(docker --version | awk '{print $3}' | tr -d ',')
echo "[+] Docker Engine: $DOCKER_VERSION"

# 3. Docker Compose Check
if docker compose version &> /dev/null; then
  COMPOSE_VER=$(docker compose version --short)
  echo "[+] Docker Compose: v$COMPOSE_VER"
else
  echo "[-] Error: Docker Compose v2 is required ('docker compose')."
  exit 1
fi

# 4. RAM Check
TOTAL_MEM_KB=$(grep MemTotal /proc/meminfo | awk '{print $2}')
TOTAL_MEM_MB=$((TOTAL_MEM_KB / 1024))
if [ "$TOTAL_MEM_MB" -lt 950 ]; then
  echo "[-] Warning: Host RAM is ${TOTAL_MEM_MB}MB. At least 1024MB is recommended."
else
  echo "[+] Memory: ${TOTAL_MEM_MB}MB available"
fi

# 5. Free Disk Check
FREE_DISK_MB=$(df -m . | awk 'NR==2 {print $4}')
if [ "$FREE_DISK_MB" -lt 5000 ]; then
  echo "[-] Warning: Free disk is ${FREE_DISK_MB}MB. At least 5GB is recommended."
else
  echo "[+] Disk Space: ${FREE_DISK_MB}MB free"
fi

echo "=============================================="
echo "[+] All pre-flight checks passed successfully!"
echo "=============================================="
