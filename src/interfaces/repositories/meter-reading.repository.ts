import { MeterReadingBatch } from "#interfaces/meter-reading.interface";

import { UUID } from "#types/uuid.type";

/**
 * Repository interface for managing `MeterReadingBatch` entities in the utility persistence layer.
 * 
 * This repository provides methods for saving and retrieving meter reading batches associated with customers,
 * ensuring consistent access to `MeterReadingBatch` data within the utility persistence layer.
 *
 * @export
 * @interface MeterReadingRepository
 */
export interface MeterReadingRepository {
    /**
     * Saves a batch of meter readings.
     * 
     * @param {MeterReadingBatch} readingBatch - The batch of meter readings to save.
     * @returns {Promise<void>} A promise that resolves when the batch has been saved.
     * @memberof MeterReadingRepository
     */
    SaveBatch(readingBatch: MeterReadingBatch): Promise<void>;

    /**
     * Retrieves all meter reading batches for a specific customer.
     *
     * @param {UUID} customerId - The unique identifier of the customer whose meter reading batches are to be retrieved.
     * @returns {Promise<MeterReadingBatch[]>} A promise that resolves with an array of `MeterReadingBatch` entities for the specified customer, or an empty array if none are found.
     * @memberof MeterReadingRepository
     */
    GetBatchesForCustomer(customerId: UUID): Promise<MeterReadingBatch[]>;
}
