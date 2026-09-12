import { IdempotencyRecord } from "#interfaces/idempotency.interface";

import { IdempotencyOperation } from "#types/idempotency.type";

/**
 * Repository interface for managing idempotency records in the utility persistence layer.
 *
 * This repository provides methods for saving and retrieving idempotency records,
 * ensuring consistent handling of idempotent operations within the utility persistence layer.
 *
 * @export
 * @interface IdempotencyRepository
 */
export interface IdempotencyRepository {
    /**
     * Saves a new `IdempotencyRecord` to the repository.
     *
     * @param {IdempotencyRecord} record - The `IdempotencyRecord` to be saved.
     * @returns {Promise<void>} A promise that resolves when the `IdempotencyRecord` has been saved.
     * @memberof IdempotencyRepository
     */
    Save(record: IdempotencyRecord): Promise<void>;

    /**
     * Retrieves an `IdempotencyRecord` based on the operation and key.
     *
     * @param {IdempotencyOperation} operation - The idempotency operation.
     * @param {string} key - The unique key for the `IdempotencyRecord`.
     * @returns {Promise<IdempotencyRecord | undefined>} A promise that resolves with the `IdempotencyRecord` if found, or `undefined` if not found.
     * @memberof IdempotencyRepository
     */
    Get(
        operation: IdempotencyOperation,
        key: string,
    ): Promise<IdempotencyRecord | undefined>;
}
