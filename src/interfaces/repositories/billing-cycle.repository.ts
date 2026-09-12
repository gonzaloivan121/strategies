import { BillingCycle } from "#interfaces/billing-cycle.interface";

import { UUID } from "#types/uuid.type";
import { BillingCycleStatus } from "#types/billing-cycle-status.type";

/**
 * Repository interface for managing `BillingCycle` entities in the utility persistence layer.
 * 
 * This repository provides methods for saving, retrieving, listing and updating billing cycles,
 * ensuring consistent access to `BillingCycle` data within the utility persistence layer.
 *
 * @export
 * @interface BillingCycleRepository
 */
export interface BillingCycleRepository {
    /**
     * Saves a `BillingCycle` to the repository.
     *
     * @param {BillingCycle} billingCycle - The `BillingCycle` to be saved.
     * @returns {Promise<void>} A promise that resolves when the `BillingCycle` has been saved.
     * @memberof BillingCycleRepository
     */
    Save(billingCycle: BillingCycle): Promise<void>;

    /**
     * Retrieves a `BillingCycle` by its unique identifier.
     *
     * @param {UUID} billingCycleId - The unique identifier of the `BillingCycle` to retrieve.
     * @returns {Promise<BillingCycle | undefined>} A promise that resolves with the `BillingCycle` if found, or `undefined` if not found.
     * @memberof BillingCycleRepository
     */
    GetById(billingCycleId: UUID): Promise<BillingCycle | undefined>;

    /**
     * Lists all `BillingCycle` entities associated with a specific customer.
     *
     * @param {UUID} customerId - The unique identifier of the customer whose billing cycles are to be listed.
     * @returns {Promise<BillingCycle[]>} A promise that resolves with an array of `BillingCycle` entities for the specified customer, or an empty array if none are found.
     * @memberof BillingCycleRepository
     */
    ListByCustomer(customerId: UUID): Promise<BillingCycle[]>;
    
    /**
     * Updates the status of a `BillingCycle`.
     *
     * @param {UUID} billingCycleId - The unique identifier of the `BillingCycle` to update.
     * @param {BillingCycleStatus} status - The new status to set for the `BillingCycle`.
     * @returns {Promise<void>} A promise that resolves when the status has been updated.
     * @memberof BillingCycleRepository
     */
    UpdateStatus(
        billingCycleId: UUID,
        status: BillingCycleStatus,
    ): Promise<void>;
}