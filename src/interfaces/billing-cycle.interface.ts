import { UUID } from "#types/uuid.type";
import { BillingCycleStatus } from "#types/billing-cycle-status.type";

/**
 * Represents a billing cycle for a customer, including its start and end dates, due date, and current status.
 *
 * @export
 * @interface BillingCycle
 */
export interface BillingCycle {
    /**
     * The unique identifier of the `BillingCycle`.
     *
     * @type {UUID}
     * @memberof BillingCycle
     */
    id: UUID;

    /**
     * The unique identifier of the customer associated with the `BillingCycle`.
     *
     * @type {UUID}
     * @memberof BillingCycle
     */
    customerId: UUID;

    /**
     * The start date of the `BillingCycle`.
     *
     * @type {Date}
     * @memberof BillingCycle
     */
    startsAt: Date;

    /**
     * The end date of the `BillingCycle`.
     *
     * @type {Date}
     * @memberof BillingCycle
     */
    endsAt: Date;

    /**
     * The due date for the `BillingCycle`.
     *
     * @type {Date}
     * @memberof BillingCycle
     */
    dueAt: Date;
    
    /**
     * The current status of the `BillingCycle`.
     *
     * @type {BillingCycleStatus}
     * @memberof BillingCycle
     */
    status: BillingCycleStatus;
}
