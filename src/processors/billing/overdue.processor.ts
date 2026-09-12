import { Invoice } from "#interfaces/invoice.interface";
import { LateFeePolicy } from "#interfaces/late-fee-policy.interface";

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

function RoundCurrency(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
}

function TruncateToUtcDate(value: Date): Date {
    return new Date(Date.UTC(
        value.getUTCFullYear(),
        value.getUTCMonth(),
        value.getUTCDate(),
    ));
}

export interface OverdueAssessmentResult {
    invoice: Invoice;
    applied: boolean;
    statusChanged: boolean;
    overdueDays: number;
    lateFeeAmount: number;
}

export class OverdueProcessor {
    public Assess(
        invoice: Invoice,
        policy: LateFeePolicy,
        asOf: Date = new Date(),
    ): OverdueAssessmentResult {
        this.ValidatePolicy(policy);

        if (invoice.balanceDue <= 0 || invoice.status === "Paid" || invoice.status === "Voided") {
            return {
                invoice,
                applied: false,
                statusChanged: false,
                overdueDays: 0,
                lateFeeAmount: 0,
            };
        }

        const dueDate = TruncateToUtcDate(invoice.dueAt);
        const assessmentDate = TruncateToUtcDate(asOf);

        const elapsedDays = Math.floor(
            (assessmentDate.getTime() - dueDate.getTime()) / MILLISECONDS_PER_DAY,
        );

        const overdueDays = elapsedDays - policy.graceDays;
        if (overdueDays <= 0) {
            return {
                invoice,
                applied: false,
                statusChanged: false,
                overdueDays,
                lateFeeAmount: 0,
            };
        }

        let nextInvoice = invoice;
        let statusChanged = false;

        if (nextInvoice.status !== "Overdue") {
            nextInvoice = {
                ...nextInvoice,
                status: "Overdue",
            };
            statusChanged = true;
        }

        const assessmentKey = assessmentDate.toISOString().slice(0, 10);
        const alreadyAssessedForDate = nextInvoice.lineItems.some(
            (lineItem) =>
                lineItem.type === "LateFee" &&
                lineItem.description.includes(assessmentKey),
        );

        if (alreadyAssessedForDate) {
            return {
                invoice: nextInvoice,
                applied: false,
                statusChanged,
                overdueDays,
                lateFeeAmount: 0,
            };
        }

        const percentageFee = nextInvoice.balanceDue * policy.dailyRate * overdueDays;
        const uncappedFee = policy.fixedFee + percentageFee;

        const cappedFee =
            policy.maximumFee === undefined
                ? uncappedFee
                : Math.min(uncappedFee, policy.maximumFee);

        const lateFeeAmount = RoundCurrency(Math.max(cappedFee, 0));

        if (lateFeeAmount === 0) {
            return {
                invoice: nextInvoice,
                applied: false,
                statusChanged,
                overdueDays,
                lateFeeAmount: 0,
            };
        }

        const lateFeeLineItem = {
            type: "LateFee" as const,
            description: `Late fee assessment ${assessmentKey}`,
            amount: lateFeeAmount,
        };

        const updatedInvoice: Invoice = {
            ...nextInvoice,
            lineItems: [...nextInvoice.lineItems, lateFeeLineItem],
            totals: {
                ...nextInvoice.totals,
                lateFee: RoundCurrency(nextInvoice.totals.lateFee + lateFeeAmount),
                subtotal: RoundCurrency(nextInvoice.totals.subtotal + lateFeeAmount),
                totalAmount: RoundCurrency(nextInvoice.totals.totalAmount + lateFeeAmount),
            },
            balanceDue: RoundCurrency(nextInvoice.balanceDue + lateFeeAmount),
        };

        return {
            invoice: updatedInvoice,
            applied: true,
            statusChanged,
            overdueDays,
            lateFeeAmount,
        };
    }

    private ValidatePolicy(policy: LateFeePolicy): void {
        if (policy.graceDays < 0) {
            throw new Error("Late fee grace days cannot be negative.");
        }

        if (policy.dailyRate < 0) {
            throw new Error("Late fee daily rate cannot be negative.");
        }

        if (policy.fixedFee < 0) {
            throw new Error("Late fee fixed fee cannot be negative.");
        }

        if (policy.maximumFee !== undefined && policy.maximumFee < 0) {
            throw new Error("Late fee maximum fee cannot be negative.");
        }
    }
}
