import { describe, expect, it } from "vitest";

import { CustomerAccount } from "#interfaces/customer-account.interface";
import { Invoice } from "#interfaces/invoice.interface";

import { PaymentProcessor } from "#processors/billing/payment.processor";

import { MockPaymentGateway } from "#products/payment/mock.payment-gateway";

const customer: CustomerAccount = {
    id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    accountNumber: "ACC-200",
    externalId: "cust_200",
    fullName: "John Energy",
    email: "john.energy@example.com",
    phone: "+1 (555) 010-2000",
    deviceId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    notificationChannels: ["Email"],
    status: "Active",
    serviceAddress: {
        line1: "200 Main Street",
        city: "Dallas",
        region: "TX",
        postalCode: "75201",
        country: "US",
    },
    billingAddress: {
        line1: "200 Main Street",
        city: "Dallas",
        region: "TX",
        postalCode: "75201",
        country: "US",
    },
};

function CreateInvoice(): Invoice {
    return {
        id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
        invoiceNumber: "INV-2026-200",
        customerId: customer.id,
        billingCycleId: "dddddddd-dddd-dddd-dddd-dddddddddddd",
        issuedAt: new Date("2026-11-01T00:00:00.000Z"),
        dueAt: new Date("2026-11-10T00:00:00.000Z"),
        currency: "USD",
        status: "Issued",
        lineItems: [
            {
                type: "Energy",
                description: "Energy consumption charge",
                amount: 100,
            },
        ],
        totals: {
            totalConsumptionKwh: 400,
            baseEnergyCharge: 100,
            peakSurcharge: 0,
            weekendDiscount: 0,
            regulatorySurcharge: 0,
            fixedCharge: 0,
            lateFee: 0,
            subtotal: 100,
            taxAmount: 0,
            totalAmount: 100,
        },
        paidAmount: 0,
        balanceDue: 100,
    };
}

describe("PaymentProcessor", () => {
    it("captures a payment and updates invoice balances", async () => {
        const processor = new PaymentProcessor(new MockPaymentGateway());

        const result = await processor.Process({
            invoice: CreateInvoice(),
            customer,
            paymentRequest: {
                amount: 30,
                method: "Card",
                reference: "PAY-200-1",
            },
        });

        expect(result.payment.status).toBe("Captured");
        expect(result.invoice.status).toBe("PartiallyPaid");
        expect(result.invoice.paidAmount).toBe(30);
        expect(result.invoice.balanceDue).toBe(70);

        expect(result.invoice.lineItems).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    type: "Payment",
                    amount: -30,
                }),
            ]),
        );
    });

    it("throws when payment exceeds balance due", async () => {
        const processor = new PaymentProcessor(new MockPaymentGateway());

        await expect(
            processor.Process({
                invoice: CreateInvoice(),
                customer,
                paymentRequest: {
                    amount: 120,
                    method: "Card",
                    reference: "PAY-200-2",
                },
            }),
        ).rejects.toThrow("Payment amount cannot exceed invoice balance due.");
    });

    it("returns a failed payment when the gateway declines", async () => {
        const processor = new PaymentProcessor(
            new MockPaymentGateway({
                declineReferences: ["DECLINE-200"],
            }),
        );

        const originalInvoice = CreateInvoice();

        const result = await processor.Process({
            invoice: originalInvoice,
            customer,
            paymentRequest: {
                amount: 20,
                method: "BankTransfer",
                reference: "DECLINE-200",
            },
        });

        expect(result.payment.status).toBe("Failed");
        expect(result.invoice).toBe(originalInvoice);
        expect(result.invoice.paidAmount).toBe(0);
        expect(result.invoice.balanceDue).toBe(100);
    });
});
