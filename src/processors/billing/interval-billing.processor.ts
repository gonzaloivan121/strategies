import { randomUUID } from "node:crypto";

import { ConsumptionInterval } from "#interfaces/consumption-interval.interface";
import { IntervalBillingInput } from "#interfaces/interval-billing.interface";
import {
    Invoice,
    InvoiceLineItem,
    InvoiceTotals,
} from "#interfaces/invoice.interface";
import { PeakWindowDefinition } from "#interfaces/tariff-plan.interface";

const WEEKEND_DAYS = new Set([0, 6]);

function RoundCurrency(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
}

export class IntervalBillingProcessor {
    public GenerateInvoice(input: IntervalBillingInput): Invoice {
        this.ValidateInput(input);

        const totalConsumptionKwh = input.meterReadings.intervals.reduce(
            (total, interval) => total + interval.consumedKwh,
            0,
        );

        const baseEnergyCharge =
            totalConsumptionKwh * input.tariffPlan.baseRatePerKwh;

        const peakSurcharge = input.meterReadings.intervals.reduce(
            (total, interval) =>
                total +
                this.CalculatePeakSurchargeForInterval(
                    interval,
                    input.tariffPlan.baseRatePerKwh,
                    input.tariffPlan.peakWindows,
                ),
            0,
        );

        const weekendDiscount = input.meterReadings.intervals.reduce(
            (total, interval) => {
                const day = interval.startedAt.getUTCDay();
                if (!WEEKEND_DAYS.has(day)) {
                    return total;
                }

                const intervalBaseCharge =
                    interval.consumedKwh * input.tariffPlan.baseRatePerKwh;
                return total + intervalBaseCharge * input.tariffPlan.weekendDiscountRate;
            },
            0,
        );

        const regulatorySurcharge =
            totalConsumptionKwh * input.tariffPlan.regulatoryChargePerKwh;

        const fixedCharge = input.tariffPlan.fixedCharge;

        const subtotal =
            baseEnergyCharge +
            peakSurcharge +
            regulatorySurcharge +
            fixedCharge -
            weekendDiscount;

        const taxAmount = subtotal * input.tariffPlan.taxRate;
        const totalAmount = subtotal + taxAmount;

        const totals: InvoiceTotals = {
            totalConsumptionKwh: RoundCurrency(totalConsumptionKwh),
            baseEnergyCharge: RoundCurrency(baseEnergyCharge),
            peakSurcharge: RoundCurrency(peakSurcharge),
            weekendDiscount: RoundCurrency(weekendDiscount),
            regulatorySurcharge: RoundCurrency(regulatorySurcharge),
            fixedCharge: RoundCurrency(fixedCharge),
            lateFee: 0,
            subtotal: RoundCurrency(subtotal),
            taxAmount: RoundCurrency(taxAmount),
            totalAmount: RoundCurrency(totalAmount),
        };

        const lineItems = this.BuildLineItems(totals, input.tariffPlan.baseRatePerKwh);

        return {
            id: randomUUID(),
            invoiceNumber: input.invoiceNumber,
            customerId: input.customer.id,
            billingCycleId: input.billingCycle.id,
            issuedAt: input.issuedAt,
            dueAt: input.billingCycle.dueAt,
            currency: input.tariffPlan.currency,
            status: "Issued",
            lineItems,
            totals,
            paidAmount: 0,
            balanceDue: totals.totalAmount,
        };
    }

    private CalculatePeakSurchargeForInterval(
        interval: ConsumptionInterval,
        baseRatePerKwh: number,
        peakWindows: readonly PeakWindowDefinition[],
    ): number {
        const usageHour = interval.startedAt.getUTCHours();
        const usageDay = interval.startedAt.getUTCDay();

        for (const window of peakWindows) {
            if (
                window.daysOfWeek &&
                window.daysOfWeek.length > 0 &&
                !window.daysOfWeek.includes(usageDay)
            ) {
                continue;
            }

            if (!this.IsPeakInterval(usageHour, window)) {
                continue;
            }

            const normalizedMultiplier = Math.max(window.multiplier, 1);
            return (
                interval.consumedKwh *
                baseRatePerKwh *
                (normalizedMultiplier - 1)
            );
        }

        return 0;
    }

    private IsPeakInterval(
        usageHour: number,
        window: PeakWindowDefinition,
    ): boolean {
        if (window.startHour <= window.endHour) {
            return usageHour >= window.startHour && usageHour < window.endHour;
        }

        return usageHour >= window.startHour || usageHour < window.endHour;
    }

    private BuildLineItems(
        totals: InvoiceTotals,
        baseRatePerKwh: number,
    ): InvoiceLineItem[] {
        const lineItems: InvoiceLineItem[] = [
            {
                type: "Energy",
                description: "Energy consumption charge",
                amount: totals.baseEnergyCharge,
                quantity: totals.totalConsumptionKwh,
                unitRate: RoundCurrency(baseRatePerKwh),
            },
        ];

        if (totals.peakSurcharge > 0) {
            lineItems.push({
                type: "PeakSurcharge",
                description: "Peak usage surcharge",
                amount: totals.peakSurcharge,
            });
        }

        if (totals.weekendDiscount > 0) {
            lineItems.push({
                type: "WeekendDiscount",
                description: "Weekend discount",
                amount: -totals.weekendDiscount,
            });
        }

        if (totals.regulatorySurcharge > 0) {
            lineItems.push({
                type: "RegulatorySurcharge",
                description: "Regulatory compliance surcharge",
                amount: totals.regulatorySurcharge,
            });
        }

        if (totals.fixedCharge > 0) {
            lineItems.push({
                type: "FixedCharge",
                description: "Fixed service charge",
                amount: totals.fixedCharge,
            });
        }

        if (totals.taxAmount > 0) {
            lineItems.push({
                type: "Tax",
                description: "Tax",
                amount: totals.taxAmount,
            });
        }

        return lineItems;
    }

    private ValidateInput(input: IntervalBillingInput): void {
        if (input.tariffPlan.baseRatePerKwh < 0) {
            throw new Error("Tariff base rate cannot be negative.");
        }

        if (input.tariffPlan.weekendDiscountRate < 0) {
            throw new Error("Weekend discount rate cannot be negative.");
        }

        if (input.tariffPlan.regulatoryChargePerKwh < 0) {
            throw new Error("Regulatory charge cannot be negative.");
        }

        if (input.tariffPlan.taxRate < 0) {
            throw new Error("Tax rate cannot be negative.");
        }

        if (input.customer.id !== input.billingCycle.customerId) {
            throw new Error(
                "Billing cycle customer does not match the provided customer.",
            );
        }

        if (input.customer.id !== input.meterReadings.customerId) {
            throw new Error(
                "Meter reading customer does not match the provided customer.",
            );
        }

        for (const interval of input.meterReadings.intervals) {
            if (interval.consumedKwh < 0) {
                throw new Error("Consumption interval cannot be negative.");
            }

            if (interval.endedAt <= interval.startedAt) {
                throw new Error(
                    "Consumption interval end must be after start time.",
                );
            }

            if (
                interval.startedAt < input.billingCycle.startsAt ||
                interval.endedAt > input.billingCycle.endsAt
            ) {
                throw new Error(
                    "Consumption interval must be inside the billing cycle range.",
                );
            }
        }
    }
}
