import { PaymentRecord } from "#interfaces/payment.interface";

import { UUID } from "#types/uuid.type";

/**
 * Repository interface for managing `PaymentRecord` entities in the utility persistence layer.
 * 
 * This repository provides methods for saving and retrieving payment records associated with invoices,
 * ensuring consistent access to `PaymentRecord` data within the utility persistence layer.
 *
 *
 * @export
 * @interface PaymentRepository
 */
export interface PaymentRepository {
    /**
     * Saves a new `PaymentRecord` to the repository.
     *
     * @param {PaymentRecord} payment - The `PaymentRecord` entity to be saved.
     * @returns {Promise<void>} A promise that resolves when the `PaymentRecord` has been saved.
     * @memberof PaymentRepository
     */
    Save(payment: PaymentRecord): Promise<void>;

    /**
     * Lists all `PaymentRecord` entities associated with a specific invoice.
     *
     * @param {UUID} invoiceId - The unique identifier of the invoice.
     * @returns {Promise<PaymentRecord[]>} A promise that resolves with an array of `PaymentRecord` entities for the specified invoice, or an empty array if none are found.
     * @memberof PaymentRepository
     */
    ListByInvoice(invoiceId: UUID): Promise<PaymentRecord[]>;
}
