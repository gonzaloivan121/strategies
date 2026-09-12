import { describe, expect, it, vi } from "vitest";

import type { Notification } from "#interfaces/notification.interface";
import { BillingCycle } from "#interfaces/billing-cycle.interface";
import { CustomerAccount } from "#interfaces/customer-account.interface";
import { IntervalBillingInput } from "#interfaces/interval-billing.interface";
import { TariffPlan } from "#interfaces/tariff-plan.interface";

import { MockPaymentGateway } from "#products/payment/mock.payment-gateway";

import {
    UtilityBillingWorkflow,
    UtilityBillingWorkflowConfiguration,
} from "#workflows/billing/utility-billing.workflow";

function CreateCustomer(): CustomerAccount {
    return {
        id: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
        accountNumber: "ACC-300",
        externalId: "cust_300",
        fullName: "Workflow Customer",
        email: "workflow.customer@example.com",
        phone: "+1 (555) 010-3000",
        deviceId: "ffffffff-ffff-ffff-ffff-ffffffffffff",
        notificationChannels: ["Email", "SMS"],
        status: "Active",
        serviceAddress: {
            line1: "300 Main Street",
            city: "Houston",
            region: "TX",
            postalCode: "77001",
            country: "US",
        },
        billingAddress: {
            line1: "300 Main Street",
            city: "Houston",
            region: "TX",
            postalCode: "77001",
            country: "US",
        },
    };
}

function CreateBillingCycle(customerId: string): BillingCycle {
    return {
        id: "12121212-1212-1212-1212-121212121212",
        customerId,
        startsAt: new Date("2026-10-01T00:00:00.000Z"),
        endsAt: new Date("2026-10-31T23:59:59.999Z"),
        dueAt: new Date("2026-11-10T00:00:00.000Z"),
        status: "Open",
    };
}

function CreateTariffPlan(): TariffPlan {
    return {
        id: "workflow-plan",
        name: "Workflow Plan",
        currency: "USD",
        baseRatePerKwh: 0.2,
        fixedCharge: 10,
        weekendDiscountRate: 0.1,
        regulatoryChargePerKwh: 0.01,
        taxRate: 0.05,
        peakWindows: [
            {
                startHour: 17,
                endHour: 22,
                multiplier: 1.25,
            },
        ],
    };
}

function CreateWorkflowInput(customer: CustomerAccount): IntervalBillingInput {
    return {
        customer,
        billingCycle: CreateBillingCycle(customer.id),
        meterReadings: {
            meterId: "34343434-3434-3434-3434-343434343434",
            customerId: customer.id,
            timezone: "America/Chicago",
            intervals: [
                {
                    startedAt: new Date("2026-10-02T18:00:00.000Z"),
                    endedAt: new Date("2026-10-02T19:00:00.000Z"),
                    consumedKwh: 20,
                },
                {
                    startedAt: new Date("2026-10-03T09:00:00.000Z"),
                    endedAt: new Date("2026-10-03T10:00:00.000Z"),
                    consumedKwh: 15,
                },
            ],
        },
        tariffPlan: CreateTariffPlan(),
        invoiceNumber: "INV-2026-300",
        issuedAt: new Date("2026-11-01T00:00:00.000Z"),
    };
}

describe("UtilityBillingWorkflow", () => {
    it("runs billing and dispatches notifications", async () => {
        const emailSend = vi.fn(async () => true);
        const smsSend = vi.fn(async () => true);

        const emailNotification: Notification = { Send: emailSend };
        const smsNotification: Notification = { Send: smsSend };

        const configuration: UtilityBillingWorkflowConfiguration = {
            notificationChannels: [
                [
                    "Email",
                    {
                        CreateNotification: () => emailNotification,
                        ResolveRecipient: (customer) => customer.email,
                    },
                ],
                [
                    "SMS",
                    {
                        CreateNotification: () => smsNotification,
                        ResolveRecipient: (customer) => customer.phone,
                    },
                ],
            ],
            paymentGateway: new MockPaymentGateway(),
        };

        const workflow = new UtilityBillingWorkflow(configuration);
        const customer = CreateCustomer();

        const result = await workflow.RunBilling(CreateWorkflowInput(customer));

        expect(result.invoice.invoiceNumber).toBe("INV-2026-300");
        expect(result.invoice.totals.totalAmount).toBeGreaterThan(0);
        expect(result.notifications).toHaveLength(2);
        expect(result.notificationSent).toBe(true);
        expect(emailSend).toHaveBeenCalledOnce();
        expect(smsSend).toHaveBeenCalledOnce();
    });

    it("applies payment and notifies customer", async () => {
        const emailSend = vi.fn(async () => true);

        const emailNotification: Notification = { Send: emailSend };

        const configuration: UtilityBillingWorkflowConfiguration = {
            notificationChannels: [
                [
                    "Email",
                    {
                        CreateNotification: () => emailNotification,
                        ResolveRecipient: (customer) => customer.email,
                    },
                ],
            ],
            paymentGateway: new MockPaymentGateway(),
        };

        const workflow = new UtilityBillingWorkflow(configuration);
        const customer = {
            ...CreateCustomer(),
            notificationChannels: ["Email"],
        };

        const billingResult = await workflow.RunBilling(CreateWorkflowInput(customer));

        const paymentResult = await workflow.ApplyPayment({
            invoice: billingResult.invoice,
            customer,
            paymentRequest: {
                amount: 5,
                method: "Card",
                reference: "PAY-300-1",
            },
        });

        expect(paymentResult.payment.status).toBe("Captured");
        expect(paymentResult.invoice.paidAmount).toBe(5);
        expect(paymentResult.invoice.balanceDue).toBeGreaterThanOrEqual(0);
        expect(paymentResult.notificationSent).toBe(true);
        expect(emailSend).toHaveBeenCalledTimes(2);
    });
});
