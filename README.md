# strategies

This repository is a work in progress and under active change.

It is a sandbox for experimenting with architecture and design patterns in TypeScript, not a production-ready library.

## Overview

The code models a billing workflow that combines two ideas:

- Strategy pattern for pricing logic.
- Factory pattern for notification channel selection and dispatch.

The demo application executes a full flow:

1. Build a billing pipeline from pricing strategies.
2. Calculate a final price from usage data.
3. Resolve a recipient from a user profile.
4. Dispatch notifications through the selected channels.

## What Is Implemented

- Billing orchestration via `BillingWorkflow`.
- Strategy composition via `BillingProcessor`.
- Notification channel registry via `NotificationFactory`.
- A demo `BillingApplication` that runs from `src/main.ts`.
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
- Discord
- Slack

Current notification products are simulated and log to the console.

## Quick Start

### Prerequisites

- Node.js 20+
- npm 10+

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
- `npm test` - Run test suite once.
- `npm run test:watch` - Run tests in watch mode.
- `npm run test:watch` - Run tests in watch mode.
- `npm run test:doctor` - Run Vitest doctor to check the environment.
- `npm run test:coverage` - Run tests with coverage reporting.

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

- In development.
- APIs and behavior may change without notice.
- Intended for experimentation and learning.
- Not recommended for production use.

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) before opening pull requests.

## Security

Please read [SECURITY.md](SECURITY.md) for vulnerability reporting guidance.

## Support

Please read [SUPPORT.md](SUPPORT.md) for expected support scope in this sandbox.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE).