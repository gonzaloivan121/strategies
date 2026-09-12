import { PaymentMethod } from "#interfaces/payment.interface";

export interface PaymentGatewayChargeRequest {
    amount: number;
    currency: string;
    customerExternalId: string;
    reference: string;
    method: PaymentMethod;
}

export interface PaymentGatewayChargeResult {
    approved: boolean;
    transactionId: string;
    processedAt: Date;
    reason?: string;
}

export interface PaymentGateway {
    Charge(
        request: PaymentGatewayChargeRequest,
    ): Promise<PaymentGatewayChargeResult>;
}
