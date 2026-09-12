import {
    PaymentGateway,
    PaymentGatewayChargeRequest,
    PaymentGatewayChargeResult,
} from "#interfaces/payment-gateway.interface";

export interface MockPaymentGatewayOptions {
    declineReferences?: readonly string[];
    maxApprovedAmount?: number;
}

export class MockPaymentGateway implements PaymentGateway {
    private readonly declineReferences: Set<string>;

    constructor(private readonly options: MockPaymentGatewayOptions = {}) {
        this.declineReferences = new Set(options.declineReferences ?? []);
    }

    public async Charge(
        request: PaymentGatewayChargeRequest,
    ): Promise<PaymentGatewayChargeResult> {
        if (request.amount <= 0) {
            return {
                approved: false,
                transactionId: "mock_invalid_amount",
                processedAt: new Date(),
                reason: "Amount must be greater than zero.",
            };
        }

        const overLimit =
            this.options.maxApprovedAmount !== undefined &&
            request.amount > this.options.maxApprovedAmount;

        if (this.declineReferences.has(request.reference) || overLimit) {
            return {
                approved: false,
                transactionId: `mock_declined_${request.reference}`,
                processedAt: new Date(),
                reason: "Declined by mock gateway policy.",
            };
        }

        return {
            approved: true,
            transactionId: `mock_${request.reference}_${Date.now()}`,
            processedAt: new Date(),
        };
    }
}
