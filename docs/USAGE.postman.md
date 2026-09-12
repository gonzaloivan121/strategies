# Utility Billing API Guide (Postman)

This guide explains how to run the full billing workflow with the included Postman collection.

## 1. Files

- [Collection](postman/utility-billing.postman_collection.json)
- [Optional Environment](postman/utility-billing.local.postman_environment.json)

## 2. Import Into Postman

1. Open Postman.
2. Select Import.
3. Choose file postman/utility-billing.postman_collection.json.
4. Confirm the collection appears in your workspace.
5. Optional: import postman/utility-billing.local.postman_environment.json and select it before running requests.

## 3. Configure Base URL

The collection includes a variable named baseUrl with default value http://localhost:3010.

If your API uses another host or port:

1. Open the collection.
2. Edit Variables.
3. Change baseUrl.
4. Save.

## 4. Start API

Run the service before executing requests:

- Memory mode: npm run start:utility
- Docker mode: npm run docker:up

## 5. Request Execution Order

Run requests in this order to complete one billing lifecycle:

1. Health
2. OpenAPI
3. Create Customer
4. Create Tariff Plan
5. Create Billing Cycle
6. Create Meter Readings
7. Run Billing
8. Get Invoice
9. Apply Payment
10. List Payments
11. Assess Overdue

## 6. Auto-Chained Variables

The collection stores IDs automatically from responses:

- customerId: created by Create Customer
- billingCycleId: created by Create Billing Cycle
- meterId: generated in Create Meter Readings pre-request script
- invoiceId: captured in Run Billing tests

You do not need to copy/paste IDs between requests.

## 7. Idempotency In Collection

The requests Run Billing and Apply Payment send Idempotency-Key headers using collection variables:

- billingRunIdempotencyKey
- paymentIdempotencyKey

To validate conflict behavior:

1. Run Apply Payment once.
2. Edit request body amount to a different value.
3. Keep same paymentIdempotencyKey.
4. Send again.

Expected result: HTTP 409 and code idempotency_conflict.

## 8. Request Tracing

The collection sends x-request-id automatically from requestIdPrefix plus request name context, and the API echoes it back in x-request-id response header.

## 9. Expected Error Shape

Error responses follow this structure:

```json
{
  "code": "error_code",
  "error": "Human readable message",
  "requestId": "trace-id"
}
```

## 10. Tips For Team Usage

- Duplicate the collection per environment (dev, staging, prod).
- Override baseUrl per environment.
- Keep idempotency keys unique per business operation in real integrations.
- Use GET /openapi.json for contract diffing during upgrades.
