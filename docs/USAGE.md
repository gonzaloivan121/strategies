# Utility Billing Framework Usage Guide

This guide explains exactly how to run and use the software as a reusable electric utility billing platform.

## 1. What You Get

The software provides:

- Customer account management
- Tariff plan management
- Billing cycle management
- Interval meter-reading ingestion
- Invoice generation from interval readings
- Payment processing
- Overdue assessment with late-fee policy
- Notification dispatch (Email, SMS, Push)
- Idempotent billing and payment APIs
- OpenAPI contract publication

## 2. Prerequisites

- Node.js 20 or newer
- npm 10 or newer
- Optional: Docker Desktop (for containerized API + MySQL)

## 3. Install And Build

From the repository root:

```bash
npm install
npm run build
```

## 4. Run The API

### 4.1 Memory Mode (default)

```bash
npm run start:utility
```

API default address:

- Host: 0.0.0.0
- Port: 3010
- Base URL for local calls: http://localhost:3010

### 4.2 MySQL Mode (local)

Set these environment variables, then start:

```powershell
$env:UTILITY_PERSISTENCE_MODE = "mysql"
$env:UTILITY_MYSQL_HOST = "127.0.0.1"
$env:UTILITY_MYSQL_PORT = "3306"
$env:UTILITY_MYSQL_USER = "utility_app"
$env:UTILITY_MYSQL_PASSWORD = "utility_app_password"
$env:UTILITY_MYSQL_DATABASE = "utility_billing"
$env:UTILITY_MYSQL_CONNECTION_LIMIT = "8"
npm run start:utility
```

Schema bootstrap runs automatically on startup in MySQL mode.

### 4.3 Docker Compose (API + MySQL)

```bash
npm run docker:up
```

Stop all services:

```bash
npm run docker:down
```

## 5. Confirm Service Availability

### 5.1 Health

```bash
curl http://localhost:3010/health
```

Expected response:

```json
{ "status":"ok" }
```

### 5.2 OpenAPI Contract

```bash
curl http://localhost:3010/openapi.json
```

Use this document to import the API into Swagger UI, Postman, or client generators.

## 6. End-To-End API Walkthrough (PowerShell)

The following sequence creates all required entities and runs a full billing flow.

### 6.1 Set Common Variables

```powershell
$BaseUrl = "http://localhost:3010"
$JsonHeaders = @{
  "Content-Type" = "application/json"
  "x-request-id" = "usage-guide-demo-001"
}
```

### 6.2 Create Customer

Required fields:

- accountNumber
- externalId
- fullName
- email
- phone
- serviceAddress.line1
- serviceAddress.city
- serviceAddress.region
- serviceAddress.postalCode
- serviceAddress.country

Optional fields (defaults applied if omitted):

- id (auto-generated UUID)
- deviceId (auto-generated UUID)
- status (default Active)
- notificationChannels (default ["Email"])
- billingAddress (defaults to serviceAddress)

```powershell
$CustomerPayload = @{
  accountNumber = "ACC-001"
  externalId = "cust-001"
  fullName = "Jane Utility"
  email = "jane.utility@example.com"
  phone = "+15550101000"
  notificationChannels = @("Email")
  serviceAddress = @{
    line1 = "100 Main Street"
    city = "Austin"
    region = "TX"
    postalCode = "78701"
    country = "US"
  }
} | ConvertTo-Json -Depth 10

$Customer = Invoke-RestMethod -Method Post -Uri "$BaseUrl/customers" -Headers $JsonHeaders -Body $CustomerPayload
$CustomerId = $Customer.id
```

### 6.3 Create Tariff Plan

Required fields:

- id
- name
- currency
- baseRatePerKwh
- fixedCharge
- weekendDiscountRate
- regulatoryChargePerKwh
- taxRate
- peakWindows (non-empty array)

```powershell
$TariffPayload = @{
  id = "residential-v1"
  name = "Residential V1"
  currency = "USD"
  baseRatePerKwh = 0.14
  fixedCharge = 8.50
  weekendDiscountRate = 0.05
  regulatoryChargePerKwh = 0.015
  taxRate = 0.12
  peakWindows = @(
    @{
      startHour = 18
      endHour = 22
      multiplier = 1.30
      daysOfWeek = @(1,2,3,4,5)
    }
  )
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Method Post -Uri "$BaseUrl/tariff-plans" -Headers $JsonHeaders -Body $TariffPayload
```

### 6.4 Create Billing Cycle

Required fields:

- customerId
- startsAt (ISO datetime)
- endsAt (ISO datetime)
- dueAt (ISO datetime)

Optional fields:

- id (auto-generated UUID)
- status (default Open)

```powershell
$CyclePayload = @{
  customerId = $CustomerId
  startsAt = "2026-11-01T00:00:00.000Z"
  endsAt = "2026-11-30T23:59:59.999Z"
  dueAt = "2026-12-10T00:00:00.000Z"
} | ConvertTo-Json -Depth 10

$BillingCycle = Invoke-RestMethod -Method Post -Uri "$BaseUrl/billing-cycles" -Headers $JsonHeaders -Body $CyclePayload
$BillingCycleId = $BillingCycle.id
```

### 6.5 Store Meter Readings

Required fields:

- meterId
- customerId
- timezone
- intervals (non-empty)

Each interval requires:

- startedAt (ISO datetime)
- endedAt (ISO datetime)
- consumedKwh

```powershell
$MeterId = [guid]::NewGuid().ToString()

$MeterPayload = @{
  meterId = $MeterId
  customerId = $CustomerId
  timezone = "America/Chicago"
  intervals = @(
    @{
      startedAt = "2026-11-02T01:00:00.000Z"
      endedAt = "2026-11-02T02:00:00.000Z"
      consumedKwh = 1.8
    },
    @{
      startedAt = "2026-11-02T18:00:00.000Z"
      endedAt = "2026-11-02T19:00:00.000Z"
      consumedKwh = 2.2
    },
    @{
      startedAt = "2026-11-09T18:00:00.000Z"
      endedAt = "2026-11-09T19:00:00.000Z"
      consumedKwh = 2.0
    }
  )
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Method Post -Uri "$BaseUrl/meter-readings" -Headers $JsonHeaders -Body $MeterPayload
```

### 6.6 Generate Invoice (Idempotent)

Required fields:

- customerId
- billingCycleId
- tariffPlanId
- meterId

Optional fields:

- invoiceNumber
- issuedAt
- idempotencyKey (body)

You can also send idempotency key in header Idempotency-Key.

```powershell
$BillingHeaders = @{
  "Content-Type" = "application/json"
  "Idempotency-Key" = "billrun-acc001-2026-11"
  "x-request-id" = "usage-guide-demo-002"
}

$BillingRunPayload = @{
  customerId = $CustomerId
  billingCycleId = $BillingCycleId
  tariffPlanId = "residential-v1"
  meterId = $MeterId
  invoiceNumber = "INV-2026-001"
  issuedAt = "2026-12-01T00:00:00.000Z"
} | ConvertTo-Json -Depth 10

$BillingResult = Invoke-RestMethod -Method Post -Uri "$BaseUrl/billing-runs" -Headers $BillingHeaders -Body $BillingRunPayload
$InvoiceId = $BillingResult.invoice.id
```

### 6.7 Retrieve Invoice

```powershell
$Invoice = Invoke-RestMethod -Method Get -Uri "$BaseUrl/invoices/$InvoiceId"
```

### 6.8 Apply Payment (Idempotent)

Required fields:

- invoiceId
- amount
- method (Card, BankTransfer, Cash, Wallet)

Optional fields:

- reference
- idempotencyKey (body)

```powershell
$PaymentHeaders = @{
  "Content-Type" = "application/json"
  "Idempotency-Key" = "payment-inv-2026-001-1"
  "x-request-id" = "usage-guide-demo-003"
}

$PaymentPayload = @{
  invoiceId = $InvoiceId
  amount = 12.00
  method = "Card"
  reference = "PMT-2026-001"
} | ConvertTo-Json -Depth 10

$PaymentResult = Invoke-RestMethod -Method Post -Uri "$BaseUrl/payments" -Headers $PaymentHeaders -Body $PaymentPayload
```

### 6.9 List Payments For Invoice

```powershell
$Payments = Invoke-RestMethod -Method Get -Uri "$BaseUrl/payments?invoiceId=$InvoiceId"
```

### 6.10 Assess Overdue Status / Late Fees

Required policy fields:

- graceDays
- dailyRate
- fixedFee

Optional:

- maximumFee
- asOf (ISO datetime)

```powershell
$OverduePayload = @{
  asOf = "2026-12-20T00:00:00.000Z"
  policy = @{
    graceDays = 2
    dailyRate = 0.01
    fixedFee = 2.00
    maximumFee = 50.00
  }
} | ConvertTo-Json -Depth 10

$OverdueInvoice = Invoke-RestMethod -Method Post -Uri "$BaseUrl/invoices/$InvoiceId/overdue-assessments" -Headers $JsonHeaders -Body $OverduePayload
```

## 7. Endpoint Reference

- GET /health
- GET /openapi.json
- POST /customers
- GET /customers
- GET /customers/{customerId}
- POST /tariff-plans
- GET /tariff-plans
- POST /billing-cycles
- GET /billing-cycles?customerId={customerId}
- POST /meter-readings
- POST /billing-runs
- GET /invoices/{invoiceId}
- GET /invoices?customerId={customerId}
- POST /invoices/{invoiceId}/overdue-assessments
- POST /payments
- GET /payments?invoiceId={invoiceId}

## 8. Idempotency Rules

For POST /billing-runs and POST /payments:

- Repeat same key + same payload: original response is replayed
- Repeat same key + different payload: HTTP 409 with code idempotency_conflict
- Empty idempotency key: HTTP 400 validation_error

## 9. Request Tracing With x-request-id

- If you send x-request-id, the server echoes it in the response header.
- If you do not send it, the server generates a UUID.
- Error responses include requestId in the JSON body.

## 10. Error Response Format

Error body shape:

```json
{
  "code": "error_code",
  "error": "Human readable message",
  "requestId": "trace-id"
}
```

Typical status codes:

- 400: validation_error or bad_request
- 404: not_found
- 409: idempotency_conflict
- 500: internal_error

## 11. Environment Variables

### 11.1 API Runtime

- UTILITY_API_HOST (default 0.0.0.0)
- UTILITY_API_PORT (default 3010)

### 11.2 Persistence Mode

- UTILITY_PERSISTENCE_MODE: memory or mysql

### 11.3 MySQL Settings (required in mysql mode)

- UTILITY_MYSQL_HOST
- UTILITY_MYSQL_PORT (default 3306)
- UTILITY_MYSQL_USER
- UTILITY_MYSQL_PASSWORD
- UTILITY_MYSQL_DATABASE
- UTILITY_MYSQL_CONNECTION_LIMIT (default 8)

A template is available in .env.example.

## 12. Important Operational Notes

- Send datetimes in ISO 8601 format, preferably UTC (ending with Z).
- Run billing only after meter readings exist within the billing cycle window.
- Notification delivery is channel-dependent; failures are returned in notifications[] per channel.
- The included payment gateway is a mock implementation for integration/testing.
