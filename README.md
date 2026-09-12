# strategies

This repository is a work in progress and under active change.

It started as a sandbox for architecture and design patterns in TypeScript and now includes a reusable utility-billing framework plus a runnable REST sample service.

For complete step-by-step usage instructions, see [docs/USAGE.md](docs/USAGE.md).

Alternative integration guides:

- [docs/USAGE.curl.md](docs/USAGE.curl.md) for Linux and macOS curl flows.
- [docs/USAGE.postman.md](docs/USAGE.postman.md) for Postman collection usage.

## Overview

The code models utility billing workflows that combine two ideas:

- Strategy pattern for pricing logic.
- Factory pattern for notification channel selection and dispatch.

The demo application executes a full flow:

1. Build a billing pipeline from pricing strategies.
2. Calculate a final price from usage data.
3. Resolve a recipient from a user profile.
4. Dispatch notifications through the selected channels.

The utility framework executes an extended flow:

1. Persist customers, tariff plans, cycles, and interval readings.
2. Run interval-based invoice generation with line-item totals.
3. Apply payments via a gateway abstraction.
4. Persist invoice and payment state transitions.
5. Dispatch invoice/payment notifications.

## What Is Implemented

- Billing orchestration via `BillingWorkflow`.
- Strategy composition via `BillingProcessor`.
- Notification channel registry via `NotificationFactory`.
- A demo `BillingApplication` that runs from `src/main.ts`.
- Utility orchestration via `UtilityBillingWorkflow` and `UtilityBillingService`.
- In-memory and MySQL persistence adapters for utility entities.
- A runnable REST sample server from `src/utility-rest.main.ts`.
- Unit tests with Vitest for core processors, strategies, factory behavior, and several notification products.

### Default Pricing Strategies

The default workflow configuration applies strategies in this order:

1. `PeakHoursTariff`
2. `WeekendDiscount`
3. `RegulatoryComplianceSurcharge`

This means final pricing depends on timestamp, day of week, and consumption.

### Supported Notification Types

- Email
- SMS
- Push

Current notification products are simulated and log to the console.

## Utility Framework Modules

- Domain contracts: customer accounts, billing cycles, interval readings, tariff plans, invoices, and payments.
- Processors: interval invoice generation and payment application.
- Workflow: billing and payment orchestration with notification dispatch.
- Service: persistence-backed orchestration API for application layers.
- Persistence:
   - In-memory adapter for local runs and tests.
   - MySQL adapter plus schema bootstrap statements.

## REST Sample Service

The service can run in memory mode (default) or MySQL mode.

Each response includes an `x-request-id` header for request tracing.

The API contract is published at `GET /openapi.json`.

### Run in Memory Mode

```bash
npm run start:utility
```

Default host/port:

- Host: `0.0.0.0`
- Port: `3010`

Optional environment variables:

- `UTILITY_API_HOST`
- `UTILITY_API_PORT`

### Run in MySQL Mode

```bash
set UTILITY_PERSISTENCE_MODE=mysql
set UTILITY_MYSQL_HOST=127.0.0.1
set UTILITY_MYSQL_PORT=3306
set UTILITY_MYSQL_USER=root
set UTILITY_MYSQL_PASSWORD=your_password
set UTILITY_MYSQL_DATABASE=utility_billing
npm run start:utility
```

At startup, schema bootstrap runs automatically for the utility tables.

### Run with Docker Compose (API + MySQL)

```bash
npm run docker:up
```

The API is available at `http://localhost:3010`.

To stop:

```bash
npm run docker:down
```

## REST Endpoints

- `GET /health`
- `POST /customers`
- `GET /customers`
- `GET /customers/:customerId`
- `POST /tariff-plans`
- `GET /tariff-plans`
- `POST /billing-cycles`
- `GET /billing-cycles?customerId=...`
- `POST /meter-readings`
- `POST /billing-runs`
- `GET /invoices/:invoiceId`
- `GET /invoices?customerId=...`
- `POST /invoices/:invoiceId/overdue-assessments`
- `POST /payments`
- `GET /payments?invoiceId=...`

### Idempotency

Use `Idempotency-Key` (or `X-Idempotency-Key`) on these endpoints:

- `POST /billing-runs`
- `POST /payments`

If the same key is repeated with the same payload, the API replays the original result.
If the same key is repeated with a different payload, the API returns an idempotency conflict error.

This behavior is persisted in both in-memory and MySQL persistence modes.

Idempotency conflict responses return HTTP `409` with:

```json
{
   "code": "idempotency_conflict",
   "error": "Idempotency key conflict for ApplyPayment: the same key was already used with a different request payload."
}
```

## Error Model

Errors use a consistent JSON shape:

```json
{
   "code": "error_code",
   "error": "Human readable message"
}
```

Current status mapping:

- `400` validation and bad request errors
- `404` missing resources
- `409` idempotency conflicts
- `500` unexpected internal errors

## Example API Flow

1. Create a customer.
2. Create a tariff plan.
3. Create a billing cycle.
4. Store interval meter readings.
5. Run billing to generate an invoice.
6. Apply a payment and retrieve payment history.
7. Optionally assess overdue late fees.

### Example: Create Customer

```json
POST /customers
{
   "accountNumber": "ACC-001",
   "externalId": "cust-001",
   "fullName": "Jane Utility",
   "email": "jane.utility@example.com",
   "phone": "+1 (555) 010-1000",
   "notificationChannels": ["Email"],
   "serviceAddress": {
      "line1": "100 Main Street",
      "city": "Austin",
      "region": "TX",
      "postalCode": "78701",
      "country": "US"
   }
}
```

### Example: Run Billing

```json
POST /billing-runs
{
   "customerId": "<customer-id>",
   "billingCycleId": "<cycle-id>",
   "tariffPlanId": "residential-v1",
   "meterId": "<meter-id>",
   "invoiceNumber": "INV-2026-001",
   "issuedAt": "2026-11-01T00:00:00.000Z"
}
```

### Example: Apply Payment

```json
POST /payments
{
   "invoiceId": "<invoice-id>",
   "amount": 25,
   "method": "Card",
   "reference": "PMT-2026-001"
}
```

### Example: Assess Overdue Late Fee

```json
POST /invoices/<invoice-id>/overdue-assessments
{
   "asOf": "2026-11-20T00:00:00.000Z",
   "policy": {
      "graceDays": 2,
      "dailyRate": 0.01,
      "fixedFee": 2,
      "maximumFee": 50
   }
}
```

## Quick Start

### Prerequisites

- Node.js 20+
- npm 10+
- Docker Desktop (optional, for containerized deployment)

### Install

```bash
npm install
```

### Build

```bash
npm run build
```

### Run Demo

```bash
npm run start
```

### Run Tests

```bash
npm test
```

## NPM Scripts

- `npm run build` - Compile TypeScript to `dist`.
- `npm run clean` - Remove build artifacts.
- `npm run start` - Build then run the demo app.
- `npm run start:utility` - Build then run the utility REST sample service.
- `npm run start:utility:dist` - Run the built utility REST service without rebuilding.
- `npm run ci:test` - Run build and tests in sequence.
- `npm run pack:check` - Preview the npm package contents with a dry run.
- `npm run docker:up` - Build and run the API and MySQL containers.
- `npm run docker:down` - Stop and remove compose services.
- `npm test` - Run test suite once.
- `npm run test:watch` - Run tests in watch mode.
- `npm run test:doctor` - Run Vitest doctor to check the environment.
- `npm run test:coverage` - Run tests with coverage reporting.

`npm publish` is protected by `prepublishOnly`, which runs the build and test pipeline before publishing.

## CI/CD

- `CI` workflow (`.github/workflows/ci.yml`) runs build, tests, and coverage on Node 20 and 22 for pushes to `main` and all pull requests.
- `Release Verification` workflow (`.github/workflows/release.yml`) runs on version tags (`v*`) or manual trigger, validates build/tests, creates an npm tarball with `npm pack`, and uploads it as a workflow artifact.

## Extending The Sandbox

### Add a Pricing Strategy

1. Implement `PricingStrategy` in `src/strategies/pricing`.
2. Register the strategy in `src/workflows/billing/default-billing.workflow-configuration.ts`.
3. Add tests under `tests/strategies/pricing`.

### Add a Notification Channel

1. Implement `Notification` in `src/products/notification`.
2. Add a registration entry in `default-billing.workflow-configuration.ts`:
   - `CreateNotification`
   - `ResolveRecipient`
3. Add tests in `tests/products/notification` or `tests/factories`.

## Project Status

- Active development with runnable API, persistence adapters, and CI coverage.
- Suitable for internal pilots and integration prototyping in electric utility contexts.
- Production usage requires provider-specific hardening (auth, observability, compliance controls, and SLO tuning).

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) before opening pull requests.

## Security

Please read [SECURITY.md](SECURITY.md) for vulnerability reporting guidance.

## Support

Please read [SUPPORT.md](SUPPORT.md) for expected support scope in this sandbox.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE).