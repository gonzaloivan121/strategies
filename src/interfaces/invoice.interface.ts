import { UUID } from "#types/uuid.type";

export type InvoiceStatus =
    | "Issued"
    | "PartiallyPaid"
    | "Paid"
    | "Overdue"
    | "Voided";

export type InvoiceLineItemType =
    | "Energy"
    | "PeakSurcharge"
    | "WeekendDiscount"
    | "RegulatorySurcharge"
    | "FixedCharge"
    | "LateFee"
    | "Tax"
    | "Adjustment"
    | "Payment";

export interface InvoiceLineItem {
    type: InvoiceLineItemType;
    description: string;
    amount: number;
    quantity?: number;
    unitRate?: number;
}

export interface InvoiceTotals {
    totalConsumptionKwh: number;
    baseEnergyCharge: number;
    peakSurcharge: number;
    weekendDiscount: number;
    regulatorySurcharge: number;
    fixedCharge: number;
    lateFee: number;
    subtotal: number;
    taxAmount: number;
    totalAmount: number;
}

export interface Invoice {
    id: UUID;
    invoiceNumber: string;
    customerId: UUID;
    billingCycleId: UUID;
    issuedAt: Date;
    dueAt: Date;
    currency: string;
    status: InvoiceStatus;
    lineItems: InvoiceLineItem[];
    totals: InvoiceTotals;
    paidAmount: number;
    balanceDue: number;
}
