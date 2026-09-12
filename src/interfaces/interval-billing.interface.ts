import { BillingCycle } from "#interfaces/billing-cycle.interface";
import { CustomerAccount } from "#interfaces/customer-account.interface";
import { MeterReadingBatch } from "#interfaces/meter-reading.interface";
import { TariffPlan } from "#interfaces/tariff-plan.interface";

export interface IntervalBillingInput {
    customer: CustomerAccount;
    billingCycle: BillingCycle;
    meterReadings: MeterReadingBatch;
    tariffPlan: TariffPlan;
    invoiceNumber: string;
    issuedAt: Date;
}
