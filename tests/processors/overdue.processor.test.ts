import { describe, expect, it } from "vitest";

import { Invoice } from "#interfaces/invoice.interface";

import { OverdueProcessor } from "#processors/billing/overdue.processor";

function CreateInvoice(status: Invoice["status"] = "Issued"): Invoice {
    return {
        id: "abababab-abab-abab-abab-abababababab",
        invoiceNumber: "INV-OD-1",
        customerId: "cdcdcdcd-cdcd-cdcd-cdcd-cdcdcdcdcdcd",
        billingCycleId: "efefefef-efef-efef-efef-efefefefefef",
        issuedAt: new Date("2026-11-01T00:00:00.000Z"),
        dueAt: new Date("2026-11-10T00:00:00.000Z"),
        currency: "USD",
        status,
        lineItems: [
            {
                type: "Energy",
                description: "Energy charge",
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

describe("OverdueProcessor", () => {
    it("applies late fee and marks invoice overdue", () => {
        const processor = new OverdueProcessor();

        const result = processor.Assess(
            CreateInvoice(),
            {
                graceDays: 2,
                dailyRate: 0.01,
                fixedFee: 2,
            },
            new Date("2026-11-15T12:00:00.000Z"),
        );

        expect(result.applied).toBe(true);
        expect(result.statusChanged).toBe(true);
        expect(result.overdueDays).toBe(3);
        expect(result.lateFeeAmount).toBe(5);
        expect(result.invoice.status).toBe("Overdue");
        expect(result.invoice.totals.lateFee).toBe(5);
        expect(result.invoice.balanceDue).toBe(105);
    });

    it("does not apply duplicate late fee for same assessment date", () => {
        const processor = new OverdueProcessor();

        const first = processor.Assess(
            CreateInvoice(),
            {
                graceDays: 0,
                dailyRate: 0.01,
                fixedFee: 1,
            },
            new Date("2026-11-12T00:00:00.000Z"),
        );

        const second = processor.Assess(
            first.invoice,
            {
                graceDays: 0,
                dailyRate: 0.01,
                fixedFee: 1,
            },
            new Date("2026-11-12T15:00:00.000Z"),
        );

        expect(first.applied).toBe(true);
        expect(second.applied).toBe(false);
        expect(second.invoice.totals.lateFee).toBe(first.invoice.totals.lateFee);

        const lateFeeItems = second.invoice.lineItems.filter(
            (lineItem) => lineItem.type === "LateFee",
        );
        expect(lateFeeItems).toHaveLength(1);
    });

    it("skips late fee on paid invoices", () => {
        const processor = new OverdueProcessor();

        const paidInvoice = {
            ...CreateInvoice("Paid"),
            paidAmount: 100,
            balanceDue: 0,
        };

        const result = processor.Assess(
            paidInvoice,
            {
                graceDays: 0,
                dailyRate: 0.02,
                fixedFee: 5,
            },
            new Date("2026-11-30T00:00:00.000Z"),
        );

        expect(result.applied).toBe(false);
        expect(result.invoice).toBe(paidInvoice);
    });
});
