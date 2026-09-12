import { BillingCycle } from "#interfaces/billing-cycle.interface";
import { CustomerAccount } from "#interfaces/customer-account.interface";
import { IdempotencyRecord } from "#interfaces/idempotency.interface";
import { Invoice } from "#interfaces/invoice.interface";
import { MeterReadingBatch } from "#interfaces/meter-reading.interface";
import { PaymentRecord } from "#interfaces/payment.interface";
import { BillingCycleRepository } from "#interfaces/repositories/billing-cycle.repository";
import { CustomerAccountRepository } from "#interfaces/repositories/customer-account.repository";
import { IdempotencyRepository } from "#interfaces/repositories/idempotency.repository";
import { InvoiceRepository } from "#interfaces/repositories/invoice.repository";
import { MeterReadingRepository } from "#interfaces/repositories/meter-reading.repository";
import { PaymentRepository } from "#interfaces/repositories/payment.repository";
import { TariffPlanRepository } from "#interfaces/repositories/tariff-plan.repository";
import { TariffPlan } from "#interfaces/tariff-plan.interface";
import { UtilityPersistence } from "#interfaces/utility-persistence.interface";
import { BillingCycleStatus } from "#types/billing-cycle-status.type";

import { UUID } from "#types/uuid.type";

/**
 * Creates a deep clone of the given value using `structuredClone`.
 *
 * @template T - The type of the value to clone.
 * @param {T} value - The value to clone.
 * @returns {T} The cloned value.
 */
function Clone<T>(value: T): T {
    return structuredClone(value);
}

export class InMemoryUtilityPersistence implements UtilityPersistence {
    private readonly customerAccountsStorage = new Map<UUID, CustomerAccount>();
    private readonly tariffPlansStorage = new Map<UUID, TariffPlan>();
    private readonly billingCyclesStorage = new Map<UUID, BillingCycle>();
    private readonly meterReadingStorage: MeterReadingBatch[] = [];
    private readonly invoicesStorage = new Map<UUID, Invoice>();
    private readonly invoiceByNumberStorage = new Map<string, UUID>();
    private readonly paymentsStorage = new Map<UUID, PaymentRecord>();
    private readonly idempotencyStorage = new Map<string, IdempotencyRecord>();

    public readonly customerAccounts: CustomerAccountRepository = {
        Save: async (customerAccount: CustomerAccount) => {
            this.customerAccountsStorage.set(customerAccount.id, Clone(customerAccount));
        },
        GetById: async (customerId: UUID) => {
            const customerAccount = this.customerAccountsStorage.get(customerId);
            return customerAccount ? Clone(customerAccount) : undefined;
        },
        List: async () => {
            return Array.from(this.customerAccountsStorage.values()).map(Clone);
        },
    };

    public readonly tariffPlans: TariffPlanRepository = {
        Save: async (tariffPlan: TariffPlan) => {
            this.tariffPlansStorage.set(tariffPlan.id, Clone(tariffPlan));
        },
        GetById: async (tariffPlanId: UUID) => {
            const tariffPlan = this.tariffPlansStorage.get(tariffPlanId);
            return tariffPlan ? Clone(tariffPlan) : undefined;
        },
        List: async () => {
            return Array.from(this.tariffPlansStorage.values()).map(Clone);
        },
    };

    public readonly billingCycles: BillingCycleRepository = {
        Save: async (billingCycle: BillingCycle) => {
            this.billingCyclesStorage.set(billingCycle.id, Clone(billingCycle));
        },
        GetById: async (billingCycleId: UUID) => {
            const billingCycle = this.billingCyclesStorage.get(billingCycleId);
            return billingCycle ? Clone(billingCycle) : undefined;
        },
        ListByCustomer: async (customerId: UUID) => {
            return Array.from(this.billingCyclesStorage.values())
                .filter((billingCycle) => billingCycle.customerId === customerId)
                .map(Clone)
                .sort(
                    (left, right) =>
                        right.startsAt.getTime() - left.startsAt.getTime(),
                );
        },
        UpdateStatus: async (billingCycleId: UUID, status: BillingCycleStatus) => {
            const billingCycle = this.billingCyclesStorage.get(billingCycleId);
            if (!billingCycle) {
                throw new Error(`Billing cycle not found: ${billingCycleId}`);
            }

            this.billingCyclesStorage.set(billingCycleId, {
                ...billingCycle,
                status,
            });
        },
    };

    public readonly meterReadings: MeterReadingRepository = {
        SaveBatch: async (readingBatch: MeterReadingBatch) => {
            this.meterReadingStorage.push(Clone(readingBatch));
        },
        GetBatchesForCustomer: async (customerId: UUID) => {
            return this.meterReadingStorage
                .filter((readingBatch) => readingBatch.customerId === customerId)
                .map(Clone);
        },
    };

    public readonly invoices: InvoiceRepository = {
        Save: async (invoice: Invoice) => {
            this.invoicesStorage.set(invoice.id, Clone(invoice));
            this.invoiceByNumberStorage.set(invoice.invoiceNumber, invoice.id);
        },
        Update: async (invoice: Invoice) => {
            this.invoicesStorage.set(invoice.id, Clone(invoice));
            this.invoiceByNumberStorage.set(invoice.invoiceNumber, invoice.id);
        },
        GetById: async (invoiceId: UUID) => {
            const invoice = this.invoicesStorage.get(invoiceId);
            return invoice ? Clone(invoice) : undefined;
        },
        GetByInvoiceNumber: async (invoiceNumber: string) => {
            const invoiceId = this.invoiceByNumberStorage.get(invoiceNumber);
            if (!invoiceId) {
                return undefined;
            }

            const invoice = this.invoicesStorage.get(invoiceId);
            return invoice ? Clone(invoice) : undefined;
        },
        ListByCustomer: async (customerId: UUID) => {
            return Array.from(this.invoicesStorage.values())
                .filter((invoice) => invoice.customerId === customerId)
                .map(Clone)
                .sort((left, right) => right.issuedAt.getTime() - left.issuedAt.getTime());
        },
    };

    public readonly payments: PaymentRepository = {
        Save: async (payment: PaymentRecord) => {
            this.paymentsStorage.set(payment.id, Clone(payment));
        },
        ListByInvoice: async (invoiceId: UUID) => {
            return Array.from(this.paymentsStorage.values())
                .filter((payment) => payment.invoiceId === invoiceId)
                .map(Clone)
                .sort(
                    (left, right) =>
                        right.createdAt.getTime() - left.createdAt.getTime(),
                );
        },
    };

    public readonly idempotency: IdempotencyRepository = {
        Save: async (record: IdempotencyRecord) => {
            const mapKey = this.BuildIdempotencyMapKey(
                record.operation,
                record.key,
            );

            this.idempotencyStorage.set(mapKey, Clone(record));
        },
        Get: async (operation, key) => {
            const mapKey = this.BuildIdempotencyMapKey(operation, key);
            const record = this.idempotencyStorage.get(mapKey);
            return record ? Clone(record) : undefined;
        },
    };

    private BuildIdempotencyMapKey(operation: string, key: string): string {
        return `${operation}:${key}`;
    }
}
