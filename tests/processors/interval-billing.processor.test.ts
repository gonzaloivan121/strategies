import { describe, expect, it } from "vitest";

import { BillingCycle } from "#interfaces/billing-cycle.interface";
import { CustomerAccount } from "#interfaces/customer-account.interface";
import { IntervalBillingInput } from "#interfaces/interval-billing.interface";
import { MeterReadingBatch } from "#interfaces/meter-reading.interface";
import { TariffPlan } from "#interfaces/tariff-plan.interface";

import { IntervalBillingProcessor } from "#processors/billing/interval-billing.processor";

const customer: CustomerAccount = {
    id: "11111111-1111-1111-1111-111111111111",
    accountNumber: "ACC-100",
    externalId: "cust_100",
    fullName: "Jane Utility",
    email: "jane.utility@example.com",
    phone: "+1 (555) 010-1000",
    deviceId: "22222222-2222-2222-2222-222222222222",
    notificationChannels: ["Email"],
    status: "Active",
    serviceAddress: {
        line1: "100 Main Street",
        city: "Austin",
        region: "TX",
        postalCode: "78701",
        country: "US",
    },
    billingAddress: {
        line1: "100 Main Street",
        city: "Austin",
        region: "TX",
        postalCode: "78701",
        country: "US",
    },
};

const billingCycle: BillingCycle = {
    id: "33333333-3333-3333-3333-333333333333",
    customerId: customer.id,
    startsAt: new Date("2026-10-01T00:00:00.000Z"),
    endsAt: new Date("2026-10-31T23:59:59.999Z"),
    dueAt: new Date("2026-11-10T00:00:00.000Z"),
    status: "Open",
};

const tariffPlan: TariffPlan = {
    id: "residential-v1",
    name: "Residential V1",
    currency: "USD",
    baseRatePerKwh: 0.2,
    fixedCharge: 15,
    weekendDiscountRate: 0.1,
    regulatoryChargePerKwh: 0.02,
    taxRate: 0.15,
    peakWindows: [
        {
            startHour: 17,
            endHour: 22,
            multiplier: 1.5,
        },
    ],
};

describe("IntervalBillingProcessor", () => {
    it("generates a line-itemized invoice from interval readings", () => {
        const processor = new IntervalBillingProcessor();

        const meterReadings: MeterReadingBatch = {
            meterId: "44444444-4444-4444-4444-444444444444",
            customerId: customer.id,
            timezone: "America/Chicago",
            intervals: [
                {
                    startedAt: new Date("2026-10-02T18:00:00.000Z"),
                    endedAt: new Date("2026-10-02T19:00:00.000Z"),
                    consumedKwh: 10,
                },
                {
                    startedAt: new Date("2026-10-02T14:00:00.000Z"),
                    endedAt: new Date("2026-10-02T15:00:00.000Z"),
                    consumedKwh: 5,
                },
                {
                    startedAt: new Date("2026-10-03T18:00:00.000Z"),
                    endedAt: new Date("2026-10-03T19:00:00.000Z"),
                    consumedKwh: 4,
                },
            ],
        };

        const input: IntervalBillingInput = {
            customer,
            billingCycle,
            meterReadings,
            tariffPlan,
            invoiceNumber: "INV-2026-100",
            issuedAt: new Date("2026-11-01T00:00:00.000Z"),
        };

        const invoice = processor.GenerateInvoice(input);

        expect(invoice.customerId).toBe(customer.id);
        expect(invoice.billingCycleId).toBe(billingCycle.id);
        expect(invoice.status).toBe("Issued");

        expect(invoice.totals).toEqual({
            totalConsumptionKwh: 19,
            baseEnergyCharge: 3.8,
            peakSurcharge: 1.4,
            weekendDiscount: 0.08,
            regulatorySurcharge: 0.38,
            fixedCharge: 15,
            lateFee: 0,
            subtotal: 20.5,
            taxAmount: 3.08,
            totalAmount: 23.58,
        });

        expect(invoice.balanceDue).toBe(23.58);

        expect(invoice.lineItems).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    type: "Energy",
                    amount: 3.8,
                    quantity: 19,
                    unitRate: 0.2,
                }),
                expect.objectContaining({
                    type: "PeakSurcharge",
                    amount: 1.4,
                }),
                expect.objectContaining({
                    type: "WeekendDiscount",
                    amount: -0.08,
                }),
                expect.objectContaining({
                    type: "RegulatorySurcharge",
                    amount: 0.38,
                }),
                expect.objectContaining({
                    type: "FixedCharge",
                    amount: 15,
                }),
                expect.objectContaining({
                    type: "Tax",
                    amount: 3.08,
                }),
            ]),
        );
    });

    it("fails when an interval is outside of the billing cycle", () => {
        const processor = new IntervalBillingProcessor();

        const meterReadings: MeterReadingBatch = {
            meterId: "44444444-4444-4444-4444-444444444444",
            customerId: customer.id,
            timezone: "America/Chicago",
            intervals: [
                {
                    startedAt: new Date("2026-11-01T00:00:00.000Z"),
                    endedAt: new Date("2026-11-01T01:00:00.000Z"),
                    consumedKwh: 3,
                },
            ],
        };

        const input: IntervalBillingInput = {
            customer,
            billingCycle,
            meterReadings,
            tariffPlan,
            invoiceNumber: "INV-2026-101",
            issuedAt: new Date("2026-11-01T00:00:00.000Z"),
        };

        expect(() => processor.GenerateInvoice(input)).toThrow(
            "Consumption interval must be inside the billing cycle range.",
        );
    });
});
