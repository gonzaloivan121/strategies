import { RowDataPacket } from "mysql2/promise";

/**
 * Represents a row in the `idempotency` table.
 *
 * @export
 * @interface IdempotencyTable
 * @extends {RowDataPacket}
 */
export interface IdempotencyTable extends RowDataPacket {
    /**
     * The name of the `Idempotency` operation.
     *
     * @type {string}
     * @memberof IdempotencyTable
     */
    operation: string;

    /**
     * The `Idempotency` key associated with the operation.
     *
     * @type {string}
     * @memberof IdempotencyTable
     */
    idempotency_key: string;

    /**
     * The hash of the request associated with the `Idempotency` operation.
     *
     * @type {string}
     * @memberof IdempotencyTable
     */
    request_hash: string;

    /**
     * The response data associated with the `Idempotency` operation.
     *
     * @type {string}
     * @memberof IdempotencyTable
     */
    response_data: string;

    /**
     * The creation timestamp of the `Idempotency` record.
     *
     * @type {(Date | string)}
     * @memberof IdempotencyTable
     */
    created_at: Date | string;

    /**
     * The last update timestamp of the `Idempotency` record.
     *
     * @type {(Date | string)}
     * @memberof IdempotencyTable
     */
    updated_at: Date | string;
}
