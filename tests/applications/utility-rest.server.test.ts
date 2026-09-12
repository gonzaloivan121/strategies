import { AddressInfo } from "node:net";

import { afterEach, describe, expect, it, vi } from "vitest";

import type { Notification } from "#interfaces/notification.interface";

import { CreateUtilityRestServer } from "#applications/utility/utility-rest.server";
import { InMemoryUtilityPersistence } from "#persistence/in-memory/in-memory.utility-persistence";

import { MockPaymentGateway } from "#products/payment/mock.payment-gateway";
import { UtilityBillingService } from "#services/utility-billing.service";
import { UtilityBillingWorkflow } from "#workflows/billing/utility-billing.workflow";

interface TestServer {
    baseUrl: string;
    close: () => Promise<void>;
}

const testServers: TestServer[] = [];

async function StartServer(): Promise<TestServer> {
    const notificationSend = vi.fn(async () => true);
    const notification: Notification = { Send: notificationSend };

    const workflow = new UtilityBillingWorkflow({
        notificationChannels: [
            [
                "Email",
                {
                    CreateNotification: () => notification,
                    ResolveRecipient: (customer) => customer.email,
                },
            ],
        ],
        paymentGateway: new MockPaymentGateway(),
    });

    const service = new UtilityBillingService(
        new InMemoryUtilityPersistence(),
        workflow,
    );

    const app = CreateUtilityRestServer({ service });

    const server = await new Promise<import("node:http").Server>((resolve) => {
        const instance = app.listen(0, "127.0.0.1", () => resolve(instance));
    });

    const address = server.address() as AddressInfo;

    const runtime: TestServer = {
        baseUrl: `http://127.0.0.1:${address.port}`,
        close: async () => {
            await new Promise<void>((resolve, reject) => {
                server.close((error?: Error) => {
                    if (error) {
                        reject(error);
                        return;
                    }

                    resolve();
                });
            });
        },
    };

    testServers.push(runtime);
    return runtime;
}

afterEach(async () => {
    while (testServers.length > 0) {
        const runtime = testServers.pop();
        if (runtime) {
            await runtime.close();
        }
    }
});

describe("UtilityRestServer", () => {
    it("publishes OpenAPI specification and request id header", async () => {
        const server = await StartServer();

        const openApiResponse = await fetch(`${server.baseUrl}/openapi.json`, {
            headers: {
                "x-request-id": "req-openapi-1",
            },
        });

        expect(openApiResponse.status).toBe(200);
        expect(openApiResponse.headers.get("x-request-id")).toBe("req-openapi-1");

        const openApi = await openApiResponse.json();

        expect(openApi.openapi).toBe("3.1.0");
        expect(openApi.paths["/billing-runs"]).toBeDefined();
        expect(openApi.paths["/payments"]).toBeDefined();
    });

    it("runs a full billing and payment flow over HTTP", async () => {
        const server = await StartServer();

        const customerResponse = await fetch(`${server.baseUrl}/customers`, {
            method: "POST",
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify({
                accountNumber: "ACC-HTTP-1",
                externalId: "cust-http-1",
                fullName: "HTTP Customer",
                email: "http.customer@example.com",
                phone: "+1 (555) 010-4000",
                notificationChannels: ["Email"],
                serviceAddress: {
                    line1: "400 Main Street",
                    city: "Phoenix",
                    region: "AZ",
                    postalCode: "85001",
                    country: "US",
                },
            }),
        });

        expect(customerResponse.status).toBe(201);
        expect(customerResponse.headers.get("x-request-id")).toBeTruthy();
        const customer = await customerResponse.json();

        const tariffResponse = await fetch(`${server.baseUrl}/tariff-plans`, {
            method: "POST",
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify({
                id: "http-plan-v1",
                name: "HTTP Plan",
                currency: "USD",
                baseRatePerKwh: 0.2,
                fixedCharge: 10,
                weekendDiscountRate: 0.1,
                regulatoryChargePerKwh: 0.02,
                taxRate: 0.05,
                peakWindows: [
                    {
                        startHour: 17,
                        endHour: 22,
                        multiplier: 1.25,
                    },
                ],
            }),
        });

        expect(tariffResponse.status).toBe(201);

        const cycleResponse = await fetch(`${server.baseUrl}/billing-cycles`, {
            method: "POST",
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify({
                customerId: customer.id,
                startsAt: "2026-10-01T00:00:00.000Z",
                endsAt: "2026-10-31T23:59:59.999Z",
                dueAt: "2026-11-10T00:00:00.000Z",
            }),
        });

        expect(cycleResponse.status).toBe(201);
        const cycle = await cycleResponse.json();

        const readingsResponse = await fetch(`${server.baseUrl}/meter-readings`, {
            method: "POST",
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify({
                meterId: "a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2",
                customerId: customer.id,
                timezone: "UTC",
                intervals: [
                    {
                        startedAt: "2026-10-02T18:00:00.000Z",
                        endedAt: "2026-10-02T19:00:00.000Z",
                        consumedKwh: 8,
                    },
                    {
                        startedAt: "2026-10-03T10:00:00.000Z",
                        endedAt: "2026-10-03T11:00:00.000Z",
                        consumedKwh: 6,
                    },
                ],
            }),
        });

        expect(readingsResponse.status).toBe(201);

        const billingRunResponse = await fetch(`${server.baseUrl}/billing-runs`, {
            method: "POST",
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify({
                customerId: customer.id,
                billingCycleId: cycle.id,
                tariffPlanId: "http-plan-v1",
                meterId: "a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2",
                invoiceNumber: "INV-HTTP-001",
                issuedAt: "2026-11-01T00:00:00.000Z",
            }),
        });

        expect(billingRunResponse.status).toBe(201);
        const billingRun = await billingRunResponse.json();

        const paymentResponse = await fetch(`${server.baseUrl}/payments`, {
            method: "POST",
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify({
                invoiceId: billingRun.invoice.id,
                amount: 5,
                method: "Card",
                reference: "HTTP-PAY-1",
            }),
        });

        expect(paymentResponse.status).toBe(201);
        const paymentResult = await paymentResponse.json();

        expect(paymentResult.payment.status).toBe("Captured");

        const invoiceResponse = await fetch(
            `${server.baseUrl}/invoices/${billingRun.invoice.id}`,
        );
        expect(invoiceResponse.status).toBe(200);

        const invoice = await invoiceResponse.json();
        expect(invoice.paidAmount).toBe(5);

        const paymentsResponse = await fetch(
            `${server.baseUrl}/payments?invoiceId=${billingRun.invoice.id}`,
        );
        expect(paymentsResponse.status).toBe(200);

        const payments = await paymentsResponse.json();
        expect(Array.isArray(payments)).toBe(true);
        expect(payments).toHaveLength(1);
    });

    it("replays payment for repeated Idempotency-Key header", async () => {
        const server = await StartServer();

        const customerResponse = await fetch(`${server.baseUrl}/customers`, {
            method: "POST",
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify({
                accountNumber: "ACC-HTTP-2",
                externalId: "cust-http-2",
                fullName: "HTTP Customer 2",
                email: "http.customer.2@example.com",
                phone: "+1 (555) 010-4010",
                notificationChannels: ["Email"],
                serviceAddress: {
                    line1: "401 Main Street",
                    city: "Phoenix",
                    region: "AZ",
                    postalCode: "85001",
                    country: "US",
                },
            }),
        });

        expect(customerResponse.status).toBe(201);
        const customer = await customerResponse.json();

        await fetch(`${server.baseUrl}/tariff-plans`, {
            method: "POST",
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify({
                id: "http-plan-v2",
                name: "HTTP Plan 2",
                currency: "USD",
                baseRatePerKwh: 0.22,
                fixedCharge: 12,
                weekendDiscountRate: 0.1,
                regulatoryChargePerKwh: 0.02,
                taxRate: 0.05,
                peakWindows: [
                    {
                        startHour: 17,
                        endHour: 22,
                        multiplier: 1.25,
                    },
                ],
            }),
        });

        const cycleResponse = await fetch(`${server.baseUrl}/billing-cycles`, {
            method: "POST",
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify({
                customerId: customer.id,
                startsAt: "2026-10-01T00:00:00.000Z",
                endsAt: "2026-10-31T23:59:59.999Z",
                dueAt: "2026-11-10T00:00:00.000Z",
            }),
        });

        expect(cycleResponse.status).toBe(201);
        const cycle = await cycleResponse.json();

        await fetch(`${server.baseUrl}/meter-readings`, {
            method: "POST",
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify({
                meterId: "b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2",
                customerId: customer.id,
                timezone: "UTC",
                intervals: [
                    {
                        startedAt: "2026-10-02T18:00:00.000Z",
                        endedAt: "2026-10-02T19:00:00.000Z",
                        consumedKwh: 10,
                    },
                ],
            }),
        });

        const billingRunResponse = await fetch(`${server.baseUrl}/billing-runs`, {
            method: "POST",
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify({
                customerId: customer.id,
                billingCycleId: cycle.id,
                tariffPlanId: "http-plan-v2",
                meterId: "b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2",
                invoiceNumber: "INV-HTTP-002",
                issuedAt: "2026-11-01T00:00:00.000Z",
            }),
        });

        expect(billingRunResponse.status).toBe(201);
        const billingRun = await billingRunResponse.json();

        const firstPaymentResponse = await fetch(`${server.baseUrl}/payments`, {
            method: "POST",
            headers: {
                "content-type": "application/json",
                "idempotency-key": "http-pay-idemp-1",
            },
            body: JSON.stringify({
                invoiceId: billingRun.invoice.id,
                amount: 5,
                method: "Card",
                reference: "HTTP-PAY-2",
            }),
        });

        expect(firstPaymentResponse.status).toBe(201);
        expect(firstPaymentResponse.headers.get("idempotency-key")).toBe(
            "http-pay-idemp-1",
        );

        const firstPaymentBody = await firstPaymentResponse.json();

        const secondPaymentResponse = await fetch(`${server.baseUrl}/payments`, {
            method: "POST",
            headers: {
                "content-type": "application/json",
                "idempotency-key": "http-pay-idemp-1",
            },
            body: JSON.stringify({
                invoiceId: billingRun.invoice.id,
                amount: 5,
                method: "Card",
                reference: "HTTP-PAY-2",
            }),
        });

        expect(secondPaymentResponse.status).toBe(201);
        expect(secondPaymentResponse.headers.get("idempotency-key")).toBe(
            "http-pay-idemp-1",
        );

        const secondPaymentBody = await secondPaymentResponse.json();

        expect(secondPaymentBody.payment.id).toBe(firstPaymentBody.payment.id);

        const paymentsResponse = await fetch(
            `${server.baseUrl}/payments?invoiceId=${billingRun.invoice.id}`,
        );

        expect(paymentsResponse.status).toBe(200);

        const payments = await paymentsResponse.json();
        expect(payments).toHaveLength(1);
    });

    it("assesses overdue invoice through REST endpoint", async () => {
        const server = await StartServer();

        const customerResponse = await fetch(`${server.baseUrl}/customers`, {
            method: "POST",
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify({
                accountNumber: "ACC-HTTP-3",
                externalId: "cust-http-3",
                fullName: "HTTP Customer 3",
                email: "http.customer.3@example.com",
                phone: "+1 (555) 010-4020",
                notificationChannels: ["Email"],
                serviceAddress: {
                    line1: "402 Main Street",
                    city: "Phoenix",
                    region: "AZ",
                    postalCode: "85001",
                    country: "US",
                },
            }),
        });

        expect(customerResponse.status).toBe(201);
        const customer = await customerResponse.json();

        await fetch(`${server.baseUrl}/tariff-plans`, {
            method: "POST",
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify({
                id: "http-plan-v3",
                name: "HTTP Plan 3",
                currency: "USD",
                baseRatePerKwh: 0.2,
                fixedCharge: 10,
                weekendDiscountRate: 0.1,
                regulatoryChargePerKwh: 0.02,
                taxRate: 0.05,
                peakWindows: [
                    {
                        startHour: 17,
                        endHour: 22,
                        multiplier: 1.25,
                    },
                ],
            }),
        });

        const cycleResponse = await fetch(`${server.baseUrl}/billing-cycles`, {
            method: "POST",
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify({
                customerId: customer.id,
                startsAt: "2026-10-01T00:00:00.000Z",
                endsAt: "2026-10-31T23:59:59.999Z",
                dueAt: "2026-11-10T00:00:00.000Z",
            }),
        });

        expect(cycleResponse.status).toBe(201);
        const cycle = await cycleResponse.json();

        await fetch(`${server.baseUrl}/meter-readings`, {
            method: "POST",
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify({
                meterId: "c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2",
                customerId: customer.id,
                timezone: "UTC",
                intervals: [
                    {
                        startedAt: "2026-10-02T18:00:00.000Z",
                        endedAt: "2026-10-02T19:00:00.000Z",
                        consumedKwh: 8,
                    },
                ],
            }),
        });

        const billingRunResponse = await fetch(`${server.baseUrl}/billing-runs`, {
            method: "POST",
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify({
                customerId: customer.id,
                billingCycleId: cycle.id,
                tariffPlanId: "http-plan-v3",
                meterId: "c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2",
                invoiceNumber: "INV-HTTP-003",
                issuedAt: "2026-11-01T00:00:00.000Z",
            }),
        });

        expect(billingRunResponse.status).toBe(201);
        const billingRun = await billingRunResponse.json();

        const overdueResponse = await fetch(
            `${server.baseUrl}/invoices/${billingRun.invoice.id}/overdue-assessments`,
            {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                },
                body: JSON.stringify({
                    asOf: "2026-11-20T00:00:00.000Z",
                    policy: {
                        graceDays: 2,
                        dailyRate: 0.01,
                        fixedFee: 2,
                    },
                }),
            },
        );

        expect(overdueResponse.status).toBe(200);
        const overdueInvoice = await overdueResponse.json();

        expect(overdueInvoice.status).toBe("Overdue");
        expect(overdueInvoice.totals.lateFee).toBeGreaterThan(0);
    });

    it("returns 409 for idempotency conflict on payments", async () => {
        const server = await StartServer();

        const customerResponse = await fetch(`${server.baseUrl}/customers`, {
            method: "POST",
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify({
                accountNumber: "ACC-HTTP-4",
                externalId: "cust-http-4",
                fullName: "HTTP Customer 4",
                email: "http.customer.4@example.com",
                phone: "+1 (555) 010-4030",
                notificationChannels: ["Email"],
                serviceAddress: {
                    line1: "403 Main Street",
                    city: "Phoenix",
                    region: "AZ",
                    postalCode: "85001",
                    country: "US",
                },
            }),
        });

        const customer = await customerResponse.json();

        await fetch(`${server.baseUrl}/tariff-plans`, {
            method: "POST",
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify({
                id: "http-plan-v4",
                name: "HTTP Plan 4",
                currency: "USD",
                baseRatePerKwh: 0.2,
                fixedCharge: 10,
                weekendDiscountRate: 0.1,
                regulatoryChargePerKwh: 0.02,
                taxRate: 0.05,
                peakWindows: [
                    {
                        startHour: 17,
                        endHour: 22,
                        multiplier: 1.25,
                    },
                ],
            }),
        });

        const cycleResponse = await fetch(`${server.baseUrl}/billing-cycles`, {
            method: "POST",
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify({
                customerId: customer.id,
                startsAt: "2026-10-01T00:00:00.000Z",
                endsAt: "2026-10-31T23:59:59.999Z",
                dueAt: "2026-11-10T00:00:00.000Z",
            }),
        });

        const cycle = await cycleResponse.json();

        await fetch(`${server.baseUrl}/meter-readings`, {
            method: "POST",
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify({
                meterId: "d2d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2",
                customerId: customer.id,
                timezone: "UTC",
                intervals: [
                    {
                        startedAt: "2026-10-02T18:00:00.000Z",
                        endedAt: "2026-10-02T19:00:00.000Z",
                        consumedKwh: 8,
                    },
                ],
            }),
        });

        const billingRunResponse = await fetch(`${server.baseUrl}/billing-runs`, {
            method: "POST",
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify({
                customerId: customer.id,
                billingCycleId: cycle.id,
                tariffPlanId: "http-plan-v4",
                meterId: "d2d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2",
                invoiceNumber: "INV-HTTP-004",
                issuedAt: "2026-11-01T00:00:00.000Z",
            }),
        });

        const billingRun = await billingRunResponse.json();

        const firstPaymentResponse = await fetch(`${server.baseUrl}/payments`, {
            method: "POST",
            headers: {
                "content-type": "application/json",
                "idempotency-key": "http-pay-idemp-conflict",
            },
            body: JSON.stringify({
                invoiceId: billingRun.invoice.id,
                amount: 5,
                method: "Card",
                reference: "HTTP-PAY-4",
            }),
        });

        expect(firstPaymentResponse.status).toBe(201);

        const conflictResponse = await fetch(`${server.baseUrl}/payments`, {
            method: "POST",
            headers: {
                "content-type": "application/json",
                "idempotency-key": "http-pay-idemp-conflict",
            },
            body: JSON.stringify({
                invoiceId: billingRun.invoice.id,
                amount: 6,
                method: "Card",
                reference: "HTTP-PAY-4",
            }),
        });

        expect(conflictResponse.status).toBe(409);

        const conflictBody = await conflictResponse.json();
        expect(conflictBody.code).toBe("idempotency_conflict");
        expect(conflictBody.error).toContain("Idempotency key conflict");
    });

    it("returns 404 for missing invoice lookup", async () => {
        const server = await StartServer();

        const invoiceResponse = await fetch(
            `${server.baseUrl}/invoices/ffffffff-0000-0000-0000-000000000000`,
        );

        expect(invoiceResponse.status).toBe(404);

        const body = await invoiceResponse.json();
        expect(body.code).toBe("not_found");
        expect(body.error).toBe("Invoice not found.");
        expect(typeof body.requestId).toBe("string");
    });
});
