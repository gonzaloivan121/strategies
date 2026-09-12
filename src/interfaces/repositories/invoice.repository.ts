import { Invoice } from "#interfaces/invoice.interface";

import { UUID } from "#types/uuid.type";

/**
 * Repository interface for managing `Invoice` entities in the utility persistence layer.
 * 
 * This repository provides methods for saving, updating, and retrieving invoices associated with customers,
 * ensuring consistent access to `Invoice` data within the utility persistence layer.
 *
 * @export
 * @interface InvoiceRepository
 */
export interface InvoiceRepository {
    /**
     * Saves a new `Invoice` to the repository.
     *
     * @param {Invoice} invoice - The `Invoice` entity to be saved.
     * @returns {Promise<void>} A promise that resolves when the `Invoice` has been saved.
     * @memberof InvoiceRepository
     */
    Save(invoice: Invoice): Promise<void>;
    
    /**
     * Updates an existing `Invoice` in the repository.
     *
     * @param {Invoice} invoice - The `Invoice` entity to be updated.
     * @returns {Promise<void>} A promise that resolves when the `Invoice` has been updated.
     * @memberof InvoiceRepository
     */
    Update(invoice: Invoice): Promise<void>;

    /**
     * Retrieves an `Invoice` by its unique identifier.
     *
     * @param {UUID} invoiceId - The unique identifier of the `Invoice`.
     * @returns {Promise<Invoice | undefined>} A promise that resolves with the `Invoice` if found, or `undefined` if not found.
     * @memberof InvoiceRepository
     */
    GetById(invoiceId: UUID): Promise<Invoice | undefined>;

    /**
     * Retrieves an `Invoice` by its invoice number.
     *
     * @param {string} invoiceNumber - The invoice number of the `Invoice`.
     * @returns {Promise<Invoice | undefined>} A promise that resolves with the `Invoice` if found, or `undefined` if not found.
     * @memberof InvoiceRepository
     */
    GetByInvoiceNumber(invoiceNumber: string): Promise<Invoice | undefined>;

    /**
     * Lists all invoices for a specific customer.
     *
     * @param {UUID} customerId - The unique identifier of the customer.
     * @returns {Promise<Invoice[]>} A promise that resolves with an array of `Invoice` entities for the specified customer, or an empty array if none are found.
     * @memberof InvoiceRepository
     */
    ListByCustomer(customerId: UUID): Promise<Invoice[]>;
}