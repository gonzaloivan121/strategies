import { TariffPlan } from "#interfaces/tariff-plan.interface";

import { UUID } from "#types/uuid.type";

/**
 * Repository interface for managing `TariffPlan` entities in the utility persistence layer.
 * 
 * This repository provides methods for saving, retrieving, and listing tariff plans,
 * ensuring consistent access to `TariffPlan` data within the utility persistence layer.
 *
 * @export
 * @interface TariffPlanRepository
 */
export interface TariffPlanRepository {
    /**
     * Saves a `TariffPlan` to the repository.
     *
     * @param {TariffPlan} tariffPlan - The `TariffPlan` entity to save.
     * @returns {Promise<void>} A promise that resolves when the `TariffPlan` has been saved.
     * @memberof TariffPlanRepository
     */
    Save(tariffPlan: TariffPlan): Promise<void>;

    /**
     * Retrieves a `TariffPlan` by its unique identifier.
     *
     * @param {UUID} tariffPlanId - The unique identifier of the `TariffPlan` to retrieve.
     * @returns {Promise<TariffPlan | undefined>} A promise that resolves with the `TariffPlan` if found, or `undefined` if not found.
     * @memberof TariffPlanRepository
     */
    GetById(tariffPlanId: UUID): Promise<TariffPlan | undefined>;
    
    /**
     * Lists every `TariffPlan` in the repository.
     *
     * @returns {Promise<TariffPlan[]>} A promise that resolves with an array of every `TariffPlan` in the repository, or an empty array if none are found.
     * @memberof TariffPlanRepository
     */
    List(): Promise<TariffPlan[]>;
}