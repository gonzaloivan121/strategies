import { describe, expect, it, vi } from "vitest";

import { BillingCycle } from "#interfaces/billing-cycle.interface";
import { CustomerAccount } from "#interfaces/customer-account.interface";
import type { Notification } from "#interfaces/notification.interface";
import { TariffPlan } from "#interfaces/tariff-plan.interface";

import { InMemoryUtilityPersistence } from "#persistence/in-memory/in-memory.utility-persistence";

import { MockPaymentGateway } from "#products/payment/mock.payment-gateway";

import { UtilityBillingService } from "#services/utility-billing.service";

import { UtilityBillingWorkflow } from "#workflows/billing/utility-billing.workflow";

function CreateCustomer(): CustomerAccount {
    return {
        id: "51515151-5151-5151-5151-515151515151",
        accountNumber: "ACC-5151",
        externalId: "cust-5151",
        fullName: "Service Test Customer",
        email: "service.customer@example.com",
        phone: "+1 (555) 010-5151",
        deviceId: "61616161-6161-6161-6161-616161616161",
        notificationChannels: ["Email"],
        status: "Active",
        serviceAddress: {
            line1: "515 Main Street",
            city: "Denver",
            region: "CO",
            postalCode: "80202",
            country: "US",
        },
        billingAddress: {
            line1: "515 Main Street",
            city: "Denver",
            region: "CO",
            postalCode: "80202",
            country: "US",
        },
    };
}

function CreateTariffPlan(): TariffPlan {
    return {
        id: "residential-service-v1",
        name: "Residential Service V1",
        currency: "USD",
        baseRatePerKwh: 0.19,
        fixedCharge: 9,
        weekendDiscountRate: 0.08,
        regulatoryChargePerKwh: 0.01,
        taxRate: 0.05,
        peakWindows: [
            {
                startHour: 17,
                endHour: 22,
                multiplier: 1.3,
            },
        ],
    };
}

function CreateBillingCycle(customerId: string): BillingCycle {
    return {
        id: "71717171-7171-7171-7171-717171717171",
        customerId: customerId as BillingCycle["customerId"],
        startsAt: new Date("2026-10-01T00:00:00.000Z"),
        endsAt: new Date("2026-10-31T23:59:59.999Z"),
        dueAt: new Date("2026-11-12T00:00:00.000Z"),
        status: "Open",
    };
}

describe("UtilityBillingService", () => {
    function CreateService() {
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

        const persistence = new InMemoryUtilityPersistence();
        const service = new UtilityBillingService(persistence, workflow);

        return {
            service,
            notificationSend,
        };
    }

    it("stores invoice and updates billing cycle status after a billing run", async () => {
        const { service, notificationSend } = CreateService();
        const customer = CreateCustomer();
        const tariffPlan = CreateTariffPlan();
        const billingCycle = CreateBillingCycle(customer.id);

        await service.RegisterCustomerAccount(customer);
        await service.RegisterTariffPlan(tariffPlan);
        await service.RegisterBillingCycle(billingCycle);
        await service.RecordMeterReadings({
            meterId: "81818181-8181-8181-8181-818181818181",
            customerId: customer.id,
            timezone: "UTC",
            intervals: [
                {
                    startedAt: new Date("2026-10-05T18:00:00.000Z"),
                    endedAt: new Date("2026-10-05T19:00:00.000Z"),
                    consumedKwh: 10,
                },
                {
                    startedAt: new Date("2026-10-12T10:00:00.000Z"),
                    endedAt: new Date("2026-10-12T11:00:00.000Z"),
                    consumedKwh: 6,
                },
            ],
        });

        const billingResult = await service.GenerateInvoice({
            customerId: customer.id,
            billingCycleId: billingCycle.id,
            tariffPlanId: tariffPlan.id,
            meterId: "81818181-8181-8181-8181-818181818181",
            invoiceNumber: "INV-SVC-5151",
            issuedAt: new Date("2026-11-01T00:00:00.000Z"),
        });

        expect(billingResult.invoice.invoiceNumber).toBe("INV-SVC-5151");
        expect(billingResult.invoice.totals.totalAmount).toBeGreaterThan(0);
        expect(billingResult.notificationSent).toBe(true);
        expect(notificationSend).toHaveBeenCalledOnce();

        const storedInvoice = await service.GetInvoiceById(billingResult.invoice.id);
        expect(storedInvoice).toBeDefined();
        expect(storedInvoice?.balanceDue).toBe(billingResult.invoice.balanceDue);

        const billingCycles = await service.ListBillingCyclesByCustomer(customer.id);
        expect(billingCycles).toHaveLength(1);
        expect(billingCycles[0].status).toBe("Issued");
    });

    it("captures payment and persists payment history", async () => {
        const { service } = CreateService();
        const customer = CreateCustomer();
        const tariffPlan = CreateTariffPlan();
        const billingCycle = CreateBillingCycle(customer.id);

        await service.RegisterCustomerAccount(customer);
        await service.RegisterTariffPlan(tariffPlan);
        await service.RegisterBillingCycle(billingCycle);
        await service.RecordMeterReadings({
            meterId: "91919191-9191-9191-9191-919191919191",
            customerId: customer.id,
            timezone: "UTC",
            intervals: [
                {
                    startedAt: new Date("2026-10-07T18:00:00.000Z"),
                    endedAt: new Date("2026-10-07T19:00:00.000Z"),
                    consumedKwh: 20,
                },
            ],
        });

        const billingResult = await service.GenerateInvoice({
            customerId: customer.id,
            billingCycleId: billingCycle.id,
            tariffPlanId: tariffPlan.id,
            meterId: "91919191-9191-9191-9191-919191919191",
        });

        const paymentResult = await service.ApplyPayment({
            invoiceId: billingResult.invoice.id,
            amount: 5,
            method: "Card",
            reference: "PAY-SVC-1",
        });

        expect(paymentResult.payment.status).toBe("Captured");
        expect(paymentResult.invoice.paidAmount).toBe(5);
        expect(paymentResult.invoice.balanceDue).toBeGreaterThanOrEqual(0);

        const payments = await service.ListPaymentsByInvoice(billingResult.invoice.id);
        expect(payments).toHaveLength(1);
        expect(payments[0].reference).toBe("PAY-SVC-1");
    });

    it("fails when no interval readings are available for the cycle", async () => {
        const { service } = CreateService();
        const customer = CreateCustomer();
        const tariffPlan = CreateTariffPlan();
        const billingCycle = CreateBillingCycle(customer.id);

        await service.RegisterCustomerAccount(customer);
        await service.RegisterTariffPlan(tariffPlan);
        await service.RegisterBillingCycle(billingCycle);

        await expect(
            service.GenerateInvoice({
                customerId: customer.id,
                billingCycleId: billingCycle.id,
                tariffPlanId: tariffPlan.id,
                meterId: "92929292-9292-9292-9292-929292929292",
            }),
        ).rejects.toThrow(
            "No interval readings found for meter 92929292-9292-9292-9292-929292929292 in the selected cycle.",
        );
    });

    it("replays invoice generation for repeated idempotency key", async () => {
        const { service } = CreateService();
        const customer = CreateCustomer();
        const tariffPlan = CreateTariffPlan();
        const billingCycle = CreateBillingCycle(customer.id);

        await service.RegisterCustomerAccount(customer);
        await service.RegisterTariffPlan(tariffPlan);
        await service.RegisterBillingCycle(billingCycle);
        await service.RecordMeterReadings({
            meterId: "93939393-9393-9393-9393-939393939393",
            customerId: customer.id,
            timezone: "UTC",
            intervals: [
                {
                    startedAt: new Date("2026-10-07T18:00:00.000Z"),
                    endedAt: new Date("2026-10-07T19:00:00.000Z"),
                    consumedKwh: 20,
                },
            ],
        });

        const firstRun = await service.GenerateInvoice({
            customerId: customer.id,
            billingCycleId: billingCycle.id,
            tariffPlanId: tariffPlan.id,
            meterId: "93939393-9393-9393-9393-939393939393",
            invoiceNumber: "INV-IDEMP-1",
            idempotencyKey: "bill-run-1",
        });

        const replayedRun = await service.GenerateInvoice({
            customerId: customer.id,
            billingCycleId: billingCycle.id,
            tariffPlanId: tariffPlan.id,
            meterId: "93939393-9393-9393-9393-939393939393",
            invoiceNumber: "INV-IDEMP-1",
            idempotencyKey: "bill-run-1",
        });

        expect(replayedRun.invoice.id).toBe(firstRun.invoice.id);

        const invoices = await service.ListInvoicesByCustomer(customer.id);
        expect(invoices).toHaveLength(1);
    });

    it("replays payment request for repeated idempotency key", async () => {
        const { service } = CreateService();
        const customer = CreateCustomer();
        const tariffPlan = CreateTariffPlan();
        const billingCycle = CreateBillingCycle(customer.id);

        await service.RegisterCustomerAccount(customer);
        await service.RegisterTariffPlan(tariffPlan);
        await service.RegisterBillingCycle(billingCycle);
        await service.RecordMeterReadings({
            meterId: "94949494-9494-9494-9494-949494949494",
            customerId: customer.id,
            timezone: "UTC",
            intervals: [
                {
                    startedAt: new Date("2026-10-07T18:00:00.000Z"),
                    endedAt: new Date("2026-10-07T19:00:00.000Z"),
                    consumedKwh: 20,
                },
            ],
        });

        const billingRun = await service.GenerateInvoice({
            customerId: customer.id,
            billingCycleId: billingCycle.id,
            tariffPlanId: tariffPlan.id,
            meterId: "94949494-9494-9494-9494-949494949494",
            invoiceNumber: "INV-IDEMP-2",
        });

        const firstPayment = await service.ApplyPayment({
            invoiceId: billingRun.invoice.id,
            amount: 5,
            method: "Card",
            reference: "PAY-IDEMP-2",
            idempotencyKey: "pay-run-1",
        });

        const replayedPayment = await service.ApplyPayment({
            invoiceId: billingRun.invoice.id,
            amount: 5,
            method: "Card",
            reference: "PAY-IDEMP-2",
            idempotencyKey: "pay-run-1",
        });

        expect(replayedPayment.payment.id).toBe(firstPayment.payment.id);
        expect(replayedPayment.invoice.paidAmount).toBe(firstPayment.invoice.paidAmount);

        const payments = await service.ListPaymentsByInvoice(billingRun.invoice.id);
        expect(payments).toHaveLength(1);
    });

    it("rejects idempotency key reuse with different payment payload", async () => {
        const { service } = CreateService();
        const customer = CreateCustomer();
        const tariffPlan = CreateTariffPlan();
        const billingCycle = CreateBillingCycle(customer.id);

        await service.RegisterCustomerAccount(customer);
        await service.RegisterTariffPlan(tariffPlan);
        await service.RegisterBillingCycle(billingCycle);
        await service.RecordMeterReadings({
            meterId: "95959595-9595-9595-9595-959595959595",
            customerId: customer.id,
            timezone: "UTC",
            intervals: [
                {
                    startedAt: new Date("2026-10-07T18:00:00.000Z"),
                    endedAt: new Date("2026-10-07T19:00:00.000Z"),
                    consumedKwh: 20,
                },
            ],
        });

        const billingRun = await service.GenerateInvoice({
            customerId: customer.id,
            billingCycleId: billingCycle.id,
            tariffPlanId: tariffPlan.id,
            meterId: "95959595-9595-9595-9595-959595959595",
            invoiceNumber: "INV-IDEMP-3",
        });

        await service.ApplyPayment({
            invoiceId: billingRun.invoice.id,
            amount: 5,
            method: "Card",
            reference: "PAY-IDEMP-3",
            idempotencyKey: "pay-run-conflict",
        });

        await expect(
            service.ApplyPayment({
                invoiceId: billingRun.invoice.id,
                amount: 7,
                method: "Card",
                reference: "PAY-IDEMP-3",
                idempotencyKey: "pay-run-conflict",
            }),
        ).rejects.toThrow(
            "Idempotency key conflict for ApplyPayment: the same key was already used with a different request payload.",
        );
    });

    it("assesses overdue invoice and persists late fee updates", async () => {
        const { service } = CreateService();
        const customer = CreateCustomer();
        const tariffPlan = CreateTariffPlan();
        const billingCycle = CreateBillingCycle(customer.id);

        await service.RegisterCustomerAccount(customer);
        await service.RegisterTariffPlan(tariffPlan);
        await service.RegisterBillingCycle(billingCycle);
        await service.RecordMeterReadings({
            meterId: "96969696-9696-9696-9696-969696969696",
            customerId: customer.id,
            timezone: "UTC",
            intervals: [
                {
                    startedAt: new Date("2026-10-07T18:00:00.000Z"),
                    endedAt: new Date("2026-10-07T19:00:00.000Z"),
                    consumedKwh: 20,
                },
            ],
        });

        const billingRun = await service.GenerateInvoice({
            customerId: customer.id,
            billingCycleId: billingCycle.id,
            tariffPlanId: tariffPlan.id,
            meterId: "96969696-9696-9696-9696-969696969696",
            invoiceNumber: "INV-OD-SVC-1",
            issuedAt: new Date("2026-11-01T00:00:00.000Z"),
        });

        const overdueInvoice = await service.AssessInvoiceOverdue({
            invoiceId: billingRun.invoice.id,
            asOf: new Date("2026-11-20T00:00:00.000Z"),
            policy: {
                graceDays: 2,
                dailyRate: 0.01,
                fixedFee: 2,
            },
        });

        expect(overdueInvoice.status).toBe("Overdue");
        expect(overdueInvoice.totals.lateFee).toBeGreaterThan(0);

        const storedInvoice = await service.GetInvoiceById(billingRun.invoice.id);
        expect(storedInvoice?.totals.lateFee).toBe(overdueInvoice.totals.lateFee);

        const billingCycles = await service.ListBillingCyclesByCustomer(customer.id);
        expect(billingCycles[0].status).toBe("Overdue");
    });
});
