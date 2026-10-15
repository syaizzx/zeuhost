#!/usr/bin/env bash
set -euo pipefail

PORT=${PORT:-3210}
BASE_URL="http://127.0.0.1:${PORT}"
STARTED_SERVER=false
SERVER_PID=""

cleanup() {
  if [ "$STARTED_SERVER" = true ] && [ -n "$SERVER_PID" ]; then
    echo "[*] Shutting down temporary test server (PID: $SERVER_PID)..."
    kill "$SERVER_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

# Check if server is already running on PORT
if ! curl -s --max-time 1 "${BASE_URL}/api/branding" &>/dev/null; then
  echo "[*] Server not detected on port ${PORT}. Starting temporary server..."
  PORT=${PORT} bun run --cwd apps/web next start &>/dev/null &
  SERVER_PID=$!
  STARTED_SERVER=true

  # Wait up to 15s for server to become healthy
  TRIES=0
  until curl -s --max-time 1 "${BASE_URL}/api/branding" &>/dev/null || [ "$TRIES" -ge 15 ]; do
    sleep 1
    TRIES=$((TRIES + 1))
  done

  if [ "$TRIES" -ge 15 ]; then
    echo "[-] Error: Failed to start test server within 15 seconds."
    exit 1
  fi
  echo "[+] Test server ready on ${BASE_URL}."
fi

echo "=============================================="
echo "  ZeuHost End-to-End API & Integration Test"
echo "=============================================="

echo "[1/7] Testing Public Branding API..."
BRANDING_RES=$(curl -s "${BASE_URL}/api/branding")
if echo "$BRANDING_RES" | grep -q '"success":true'; then
  echo "  [+] Branding API: PASS"
else
  echo "  [-] Branding API: FAIL: $BRANDING_RES"
  exit 1
fi

echo "[2/7] Testing Subscription Plans API..."
PLANS_RES=$(curl -s "${BASE_URL}/api/plans")
if echo "$PLANS_RES" | grep -q '"success":true'; then
  echo "  [+] Plans API: PASS"
else
  echo "  [-] Plans API: FAIL: $PLANS_RES"
  exit 1
fi

echo "[3/7] Testing Bot Templates API..."
TEMPLATES_RES=$(curl -s "${BASE_URL}/api/templates")
if echo "$TEMPLATES_RES" | grep -q '"success":true'; then
  echo "  [+] Templates API: PASS"
else
  echo "  [-] Templates API: FAIL: $TEMPLATES_RES"
  exit 1
fi

echo "[4/7] Testing Customer Billing Submission..."
PAYMENT_SUBMIT=$(curl -s -X POST "${BASE_URL}/api/payments" \
  -H "Content-Type: application/json" \
  -H "x-customer-id: test-customer-123" \
  -d '{"planId":"plan-pro","amount":25000,"currency":"IDR","method":"MANUAL_TRANSFER","providerReference":"TRX-BCA-998877"}')
if echo "$PAYMENT_SUBMIT" | grep -q '"success":true'; then
  echo "  [+] Customer Payment Submission: PASS"
else
  echo "  [-] Customer Payment Submission: FAIL: $PAYMENT_SUBMIT"
  exit 1
fi

PAYMENT_ID=$(echo "$PAYMENT_SUBMIT" | grep -o '"id":"[^"]*' | cut -d'"' -f4 || echo "pay-test")

echo "[5/7] Testing Operator Admin Pending Payments List..."
PENDING_RES=$(curl -s "${BASE_URL}/api/admin/payments")
if echo "$PENDING_RES" | grep -q '"success":true'; then
  echo "  [+] Admin Pending Payments List: PASS"
else
  echo "  [-] Admin Pending Payments List: FAIL: $PENDING_RES"
  exit 1
fi

echo "[6/7] Testing Operator Payment Approval..."
APPROVE_RES=$(curl -s -X POST "${BASE_URL}/api/admin/payments/${PAYMENT_ID}/approve" \
  -H "Content-Type: application/json" \
  -H "x-staff-id: admin-owner" \
  -d '{"operatorNotes":"Approved via integration test"}')
if echo "$APPROVE_RES" | grep -q '"success":true'; then
  echo "  [+] Operator Payment Confirmation: PASS"
else
  echo "  [-] Operator Payment Confirmation: FAIL: $APPROVE_RES"
  exit 1
fi

echo "[7/7] Testing White-Label Branding Update..."
UPDATE_BRANDING_RES=$(curl -s -X POST "${BASE_URL}/api/admin/branding" \
  -H "Content-Type: application/json" \
  -d '{"productName":"ZeuHost Verified","companyName":"Zeuzz","primaryColor":"#09090b","accentColor":"#10b981","supportEmail":"cs@zeuhost.org","landingHeadline":"Hosting Bot 24 Jam","landingSubheadline":"Hosting bot WhatsApp dan Discord handal."}')
if echo "$UPDATE_BRANDING_RES" | grep -q '"success":true'; then
  echo "  [+] White-Label Update: PASS"
else
  echo "  [-] White-Label Update: FAIL: $UPDATE_BRANDING_RES"
  exit 1
fi

echo "=============================================="
echo "  All 7 End-to-End API Tests PASSED!"
echo "=============================================="
