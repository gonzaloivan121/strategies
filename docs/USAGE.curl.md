# Utility Billing API Guide (curl)

This guide provides a full end-to-end workflow using curl for Linux and macOS.

## 1. Prerequisites

- Running API instance at http://localhost:3010
- curl 8+
- jq 1.6+ (used to extract IDs from JSON responses)

## 2. Optional: Start The API

From the project root:

```bash
npm install
npm run start:utility
```

Or run with Docker Compose:

```bash
npm run docker:up
```

## 3. Set Shell Variables

```properties
BASE_URL=http://localhost:3010
REQUEST_ID_PREFIX=usage-curl
BILLING_RUN_KEY=billrun-acc001-2026-11
PAYMENT_KEY=payment-inv-2026-001-1
```

## 4. Validate Service

```bash
curl -sS "$BASE_URL/health"
curl -sS "$BASE_URL/openapi.json" | jq '.info.title, .info.version'
```

## 5. Create Customer

```bash
CUSTOMER_RESPONSE=$(curl -sS -X POST "$BASE_URL/customers" \
  -H "content-type: application/json" \
  -H "x-request-id: ${REQUEST_ID_PREFIX}-001" \
  -d '{
    "accountNumber": "ACC-001",
    "externalId": "cust-001",
    "fullName": "Jane Utility",
    "email": "jane.utility@example.com",
    "phone": "+15550101000",
    "notificationChannels": ["Email"],
    "serviceAddress": {
      "line1": "100 Main Street",
      "city": "Austin",
      "region": "TX",
      "postalCode": "78701",
      "country": "US"
    }
  }')

CUSTOMER_ID=$(echo "$CUSTOMER_RESPONSE" | jq -r '.id')
echo "CUSTOMER_ID=$CUSTOMER_ID"
```

## 6. Create Tariff Plan

```bash
curl -sS -X POST "$BASE_URL/tariff-plans" \
  -H "content-type: application/json" \
  -H "x-request-id: ${REQUEST_ID_PREFIX}-002" \
  -d '{
    "id": "residential-v1",
    "name": "Residential V1",
    "currency": "USD",
    "baseRatePerKwh": 0.14,
    "fixedCharge": 8.50,
    "weekendDiscountRate": 0.05,
    "regulatoryChargePerKwh": 0.015,
    "taxRate": 0.12,
    "peakWindows": [
      {
        "startHour": 18,
        "endHour": 22,
        "multiplier": 1.30,
        "daysOfWeek": [1, 2, 3, 4, 5]
      }
    ]
  }' | jq .
```

## 7. Create Billing Cycle

```bash
BILLING_CYCLE_RESPONSE=$(curl -sS -X POST "$BASE_URL/billing-cycles" \
  -H "content-type: application/json" \
  -H "x-request-id: ${REQUEST_ID_PREFIX}-003" \
  -d "{
    \"customerId\": \"$CUSTOMER_ID\",
    \"startsAt\": \"2026-11-01T00:00:00.000Z\",
    \"endsAt\": \"2026-11-30T23:59:59.999Z\",
    \"dueAt\": \"2026-12-10T00:00:00.000Z\"
  }")

BILLING_CYCLE_ID=$(echo "$BILLING_CYCLE_RESPONSE" | jq -r '.id')
echo "BILLING_CYCLE_ID=$BILLING_CYCLE_ID"
```

## 8. Store Meter Readings

```bash
METER_ID=$(uuidgen | tr '[:upper:]' '[:lower:]')
echo "METER_ID=$METER_ID"

curl -sS -X POST "$BASE_URL/meter-readings" \
  -H "content-type: application/json" \
  -H "x-request-id: ${REQUEST_ID_PREFIX}-004" \
  -d "{
    \"meterId\": \"$METER_ID\",
    \"customerId\": \"$CUSTOMER_ID\",
    \"timezone\": \"America/Chicago\",
    \"intervals\": [
      {
        \"startedAt\": \"2026-11-02T01:00:00.000Z\",
        \"endedAt\": \"2026-11-02T02:00:00.000Z\",
        \"consumedKwh\": 1.8
      },
      {
        \"startedAt\": \"2026-11-02T18:00:00.000Z\",
        \"endedAt\": \"2026-11-02T19:00:00.000Z\",
        \"consumedKwh\": 2.2
      },
      {
        \"startedAt\": \"2026-11-09T18:00:00.000Z\",
        \"endedAt\": \"2026-11-09T19:00:00.000Z\",
        \"consumedKwh\": 2.0
      }
    ]
  }" | jq .
```

## 9. Generate Invoice (Idempotent)

```bash
BILLING_HEADERS=$(mktemp)
BILLING_BODY=$(mktemp)

curl -sS -X POST "$BASE_URL/billing-runs" \
  -H "content-type: application/json" \
  -H "Idempotency-Key: $BILLING_RUN_KEY" \
  -H "x-request-id: ${REQUEST_ID_PREFIX}-005" \
  -d "{
    \"customerId\": \"$CUSTOMER_ID\",
    \"billingCycleId\": \"$BILLING_CYCLE_ID\",
    \"tariffPlanId\": \"residential-v1\",
    \"meterId\": \"$METER_ID\",
    \"invoiceNumber\": \"INV-2026-001\",
    \"issuedAt\": \"2026-12-01T00:00:00.000Z\"
  }" \
  -D "$BILLING_HEADERS" \
  -o "$BILLING_BODY"

grep -i '^idempotency-key:' "$BILLING_HEADERS" || true
INVOICE_ID=$(jq -r '.invoice.id' "$BILLING_BODY")
echo "INVOICE_ID=$INVOICE_ID"

rm -f "$BILLING_HEADERS" "$BILLING_BODY"
```

## 10. Retrieve Invoice

```bash
curl -sS "$BASE_URL/invoices/$INVOICE_ID" | jq .
```

## 11. Apply Payment (Idempotent)

```bash
PAYMENT_RESPONSE=$(curl -sS -X POST "$BASE_URL/payments" \
  -H "content-type: application/json" \
  -H "Idempotency-Key: $PAYMENT_KEY" \
  -H "x-request-id: ${REQUEST_ID_PREFIX}-006" \
  -d "{
    \"invoiceId\": \"$INVOICE_ID\",
    \"amount\": 12.00,
    \"method\": \"Card\",
    \"reference\": \"PMT-2026-001\"
  }")

echo "$PAYMENT_RESPONSE" | jq .
```

## 12. List Payments

```bash
curl -sS "$BASE_URL/payments?invoiceId=$INVOICE_ID" | jq .
```

## 13. Assess Overdue And Late Fees

```bash
curl -sS -X POST "$BASE_URL/invoices/$INVOICE_ID/overdue-assessments" \
  -H "content-type: application/json" \
  -H "x-request-id: ${REQUEST_ID_PREFIX}-007" \
  -d '{
    "asOf": "2026-12-20T00:00:00.000Z",
    "policy": {
      "graceDays": 2,
      "dailyRate": 0.01,
      "fixedFee": 2.00,
      "maximumFee": 50.00
    }
  }' | jq .
```

## 14. Idempotency Behavior Checks

### 14.1 Replay With Same Key And Same Payload

Repeat the billing request from section 9 with the same key and identical payload. The API returns the original result.

### 14.2 Conflict With Same Key And Different Payload

Change any field (for example amount in payment), keep the same key, and send again:

```bash
curl -sS -X POST "$BASE_URL/payments" \
  -H "content-type: application/json" \
  -H "Idempotency-Key: $PAYMENT_KEY" \
  -d "{
    \"invoiceId\": \"$INVOICE_ID\",
    \"amount\": 13.00,
    \"method\": \"Card\"
  }" | jq .
```

Expected: HTTP 409 with code `idempotency_conflict`.

## 15. Common Troubleshooting

- **400 validation_error:** check missing required fields and date format.
- **404 not_found:** verify IDs are from this environment instance.
- **409 idempotency_conflict:** same key reused with a different payload.
- **Empty or malformed response in section 9:** ensure sed and jq are installed and meter readings exist within cycle bounds.
- **Empty or malformed response in section 9:** ensure jq is installed and meter readings exist within cycle bounds.
