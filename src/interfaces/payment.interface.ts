import { UUID } from "#types/uuid.type";

export type PaymentMethod = "Card" | "BankTransfer" | "Cash" | "Wallet";

export type PaymentStatus = "Pending" | "Captured" | "Failed";

export interface InvoicePaymentRequest {
    amount: number;
    method: PaymentMethod;
    reference: string;
}

export interface PaymentRecord {
    id: UUID;
    invoiceId: UUID;
    amount: number;
    method: PaymentMethod;
    status: PaymentStatus;
    reference: string;
    gatewayTransactionId?: string;
    reason?: string;
    createdAt: Date;
}
