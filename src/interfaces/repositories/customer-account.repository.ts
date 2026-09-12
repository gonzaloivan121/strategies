import { CustomerAccount } from "#interfaces/customer-account.interface";

import { UUID } from "#types/uuid.type";

/**
 * Repository interface for managing `CustomerAccount` entities in the utility persistence layer.
 * 
 * This repository provides methods for saving, retrieving, and listing customer accounts,
 * ensuring consistent access to `CustomerAccount` data within the utility persistence layer.
 *
 * @export
 * @interface CustomerAccountRepository
 */
export interface CustomerAccountRepository {
    /**
     * Saves a `CustomerAccount` to the repository.
     *
     * @param {CustomerAccount} customerAccount - The `CustomerAccount` to be saved.
     * @returns {Promise<void>} A promise that resolves when the `CustomerAccount` has been saved.
     * @memberof CustomerAccountRepository
     */
    Save(customerAccount: CustomerAccount): Promise<void>;

    /**
     * Retrieves a `CustomerAccount` by its unique identifier.
     *
     * @param {UUID} customerId - The unique identifier of the `CustomerAccount` to retrieve.
     * @returns {Promise<CustomerAccount | undefined>} A promise that resolves with the `CustomerAccount` if found, or `undefined` if not found.
     * @memberof CustomerAccountRepository
     */
    GetById(customerId: UUID): Promise<CustomerAccount | undefined>;

    /**
     * Lists every `CustomerAccount` in the repository.
     *
     * @returns {Promise<CustomerAccount[]>} A promise that resolves with an array of every `CustomerAccount` in the repository, or an empty array if none are found.
     * @memberof CustomerAccountRepository
     */
    List(): Promise<CustomerAccount[]>;
}