import { randomUUID } from "node:crypto";

import { CustomerAccount } from "#interfaces/customer-account.interface";
import { Invoice } from "#interfaces/invoice.interface";
import {
    InvoicePaymentRequest,
    PaymentRecord,
} from "#interfaces/payment.interface";
import { PaymentGateway } from "#interfaces/payment-gateway.interface";

function RoundCurrency(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
}

export interface PaymentProcessingInput {
    invoice: Invoice;
    customer: CustomerAccount;
    paymentRequest: InvoicePaymentRequest;
}

export interface PaymentProcessingResult {
    invoice: Invoice;
    payment: PaymentRecord;
}

export class PaymentProcessor {
    constructor(private readonly paymentGateway: PaymentGateway) {}

    public async Process(
        input: PaymentProcessingInput,
    ): Promise<PaymentProcessingResult> {
        this.ValidateInput(input);

        const chargeResult = await this.paymentGateway.Charge({
            amount: input.paymentRequest.amount,
            currency: input.invoice.currency,
            customerExternalId: input.customer.externalId,
            reference: input.paymentRequest.reference,
            method: input.paymentRequest.method,
        });

        const payment: PaymentRecord = {
            id: randomUUID(),
            invoiceId: input.invoice.id,
            amount: input.paymentRequest.amount,
            method: input.paymentRequest.method,
            status: chargeResult.approved ? "Captured" : "Failed",
            reference: input.paymentRequest.reference,
            gatewayTransactionId: chargeResult.transactionId,
            reason: chargeResult.reason,
            createdAt: chargeResult.processedAt,
        };

        if (!chargeResult.approved) {
            return {
                invoice: input.invoice,
                payment,
            };
        }

        const paidAmount = RoundCurrency(
            input.invoice.paidAmount + input.paymentRequest.amount,
        );

        const balanceDue = RoundCurrency(
            input.invoice.totals.totalAmount - paidAmount,
        );

        const normalizedBalanceDue = Math.max(balanceDue, 0);

        const updatedInvoice: Invoice = {
            ...input.invoice,
            status: normalizedBalanceDue === 0 ? "Paid" : "PartiallyPaid",
            paidAmount,
            balanceDue: normalizedBalanceDue,
            lineItems: [
                ...input.invoice.lineItems,
                {
                    type: "Payment",
                    description: `Payment received (${input.paymentRequest.method})`,
                    amount: RoundCurrency(-input.paymentRequest.amount),
                },
            ],
        };

        return {
            invoice: updatedInvoice,
            payment,
        };
    }

    private ValidateInput(input: PaymentProcessingInput): void {
        if (input.paymentRequest.amount <= 0) {
            throw new Error("Payment amount must be greater than zero.");
        }

        if (input.paymentRequest.amount > input.invoice.balanceDue) {
            throw new Error("Payment amount cannot exceed invoice balance due.");
        }

        if (input.invoice.customerId !== input.customer.id) {
            throw new Error("Invoice customer does not match payment customer.");
        }
    }
}
