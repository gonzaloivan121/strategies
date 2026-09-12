import { BillingCycleRepository } from "#interfaces/repositories/billing-cycle.repository";
import { CustomerAccountRepository } from "#interfaces/repositories/customer-account.repository";
import { IdempotencyRepository } from "#interfaces/repositories/idempotency.repository";
import { InvoiceRepository } from "#interfaces/repositories/invoice.repository";
import { MeterReadingRepository } from "#interfaces/repositories/meter-reading.repository";
import { PaymentRepository } from "#interfaces/repositories/payment.repository";
import { TariffPlanRepository } from "#interfaces/repositories/tariff-plan.repository";

/**
 * Utility persistence interface for managing various repositories related to utility operations.
 *
 * @export
 * @interface UtilityPersistence
 */
export interface UtilityPersistence {
    /**
     * The billing cycles repository. It provides access to billing cycle data and operations.
     *
     * @type {BillingCycleRepository}
     * @memberof UtilityPersistence
     */
    readonly billingCycles: BillingCycleRepository;

    /**
     * The customer accounts repository. It provides access to customer account data and operations.
     *
     * @type {CustomerAccountRepository}
     * @memberof UtilityPersistence
     */
    readonly customerAccounts: CustomerAccountRepository;

    /**
     * The idempotency repository. It provides access to idempotency record data and operations.
     *
     * @type {IdempotencyRepository}
     * @memberof UtilityPersistence
     */
    readonly idempotency: IdempotencyRepository;

    /**
     * The invoices repository. It provides access to invoice data and operations.
     *
     * @type {InvoiceRepository}
     * @memberof UtilityPersistence
     */
    readonly invoices: InvoiceRepository;

    /**
     * The meter readings repository. It provides access to meter reading data and operations.
     *
     * @type {MeterReadingRepository}
     * @memberof UtilityPersistence
     */
    readonly meterReadings: MeterReadingRepository;

    /**
     * The payments repository. It provides access to payment data and operations.
     *
     * @type {PaymentRepository}
     * @memberof UtilityPersistence
     */
    readonly payments: PaymentRepository;

    /**
     * The tariff plans repository. It provides access to tariff plan data and operations.
     *
     * @type {TariffPlanRepository}
     * @memberof UtilityPersistence
     */
    readonly tariffPlans: TariffPlanRepository;
}
