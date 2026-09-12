import { IdempotencyOperation } from "#types/idempotency.type";

/**
 * Idempotency record used to track the status of idempotent operations in the utility persistence layer.
 *
 * @export
 * @interface IdempotencyRecord
 */
export interface IdempotencyRecord {
    /**
     * The `IdempotencyOperation` being tracked.
     *
     * @type {IdempotencyOperation}
     * @memberof IdempotencyRecord
     */
    operation: IdempotencyOperation;

    /**
     * The unique key identifying the `IdempotencyRecord`.
     *
     * @type {string}
     * @memberof IdempotencyRecord
     */
    key: string;

    /**
     * The hash of the request associated with the `IdempotencyRecord`.
     *
     * @type {string}
     * @memberof IdempotencyRecord
     */
    requestHash: string;

    /**
     * The response data associated with the `IdempotencyRecord`.
     *
     * @type {unknown}
     * @memberof IdempotencyRecord
     */
    responseData: unknown;

    /**
     * The timestamp when the `IdempotencyRecord` was created.
     *
     * @type {Date}
     * @memberof IdempotencyRecord
     */
    createdAt: Date;

    /**
     * The timestamp when the `IdempotencyRecord` was last updated.
     *
     * @type {Date}
     * @memberof IdempotencyRecord
     */
    updatedAt: Date;
}