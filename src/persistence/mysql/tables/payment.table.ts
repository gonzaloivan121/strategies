import { RowDataPacket } from "mysql2/promise";

import { UUID } from "#types/uuid.type";

/**
 * Represents a row in the `payments` table.
 *
 * @export
 * @interface PaymentTable
 * @extends {RowDataPacket}
 */
export interface PaymentTable extends RowDataPacket {
    /**
     * The unique identifier of the `Payment`.
     *
     * @type {UUID}
     * @memberof PaymentTable
     */
    id: UUID;

    /**
     * The unique identifier of the associated `Invoice`.
     *
     * @type {UUID}
     * @memberof PaymentTable
     */
    invoice_id: UUID;

    /**
     * The amount of the `Payment`.
     *
     * @type {(string | number)}
     * @memberof PaymentTable
     */
    amount: string | number;

    /**
     * The method of the `Payment`.
     *
     * @type {string}
     * @memberof PaymentTable
     */
    method: string;

    /**
     * The status of the `Payment`.
     *
     * @type {string}
     * @memberof PaymentTable
     */
    status: string;

    /**
     * The reference of the `Payment`.
     *
     * @type {string}
     * @memberof PaymentTable
     */
    reference: string;

    /**
     * The gateway transaction ID of the `Payment`.
     *
     * @type {(UUID | null)}
     * @memberof PaymentTable
     */
    gateway_transaction_id: UUID | null;

    /**
     * The reason for the `Payment` status.
     *
     * @type {(string | null)}
     * @memberof PaymentTable
     */
    reason: string | null;

    /**
     * The creation timestamp of the `Payment`.
     *
     * @type {(Date | string)}
     * @memberof PaymentTable
     */
    created_at: Date | string;
}
