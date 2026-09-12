import { RowDataPacket } from "mysql2/promise";

import { UUID } from "#types/uuid.type";

/**
 * Represents a row in the `invoices` table.
 *
 * @export
 * @interface InvoiceTable
 * @extends {RowDataPacket}
 */
export interface InvoiceTable extends RowDataPacket {
    /**
     * The unique identifier of the `Invoice`.
     *
     * @type {UUID}
     * @memberof InvoiceTable
     */
    id: UUID;

    /**
     * The invoice number of the `Invoice`.
     *
     * @type {string}
     * @memberof InvoiceTable
     */
    invoice_number: string;

    /**
     * The unique identifier of the `Customer` associated with the `Invoice`.
     *
     * @type {UUID}
     * @memberof InvoiceTable
     */
    customer_id: UUID;

    /**
     * The unique identifier of the `BillingCycle` associated with the `Invoice`.
     *
     * @type {UUID}
     * @memberof InvoiceTable
     */
    billing_cycle_id: UUID;

    /**
     * The date and time when the `Invoice` was issued.
     *
     * @type {(Date | string)}
     * @memberof InvoiceTable
     */
    issued_at: Date | string;

    /**
     * The date and time when the `Invoice` is due.
     *
     * @type {(Date | string)}
     * @memberof InvoiceTable
     */
    due_at: Date | string;

    /**
     * The currency of the `Invoice`.
     *
     * @type {string}
     * @memberof InvoiceTable
     */
    currency: string;

    /**
     * The status of the `Invoice`.
     *
     * @type {string}
     * @memberof InvoiceTable
     */
    status: string;

    /**
     * The line items of the `Invoice`.
     *
     * @type {string}
     * @memberof InvoiceTable
     */
    line_items: string;

    /**
     * The totals of the `Invoice`.
     *
     * @type {string}
     * @memberof InvoiceTable
     */
    totals: string;

    /**
     * The amount paid for the `Invoice`.
     *
     * @type {(string | number)}
     * @memberof InvoiceTable
     */
    paid_amount: string | number;

    /**
     * The balance due for the `Invoice`.
     *
     * @type {(string | number)}
     * @memberof InvoiceTable
     */
    balance_due: string | number;
}
