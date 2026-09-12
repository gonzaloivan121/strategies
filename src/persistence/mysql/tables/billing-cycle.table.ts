import { RowDataPacket } from "mysql2/promise";

import { UUID } from "#types/uuid.type";

/**
 * Represents a row in the `billing_cycles` table.
 *
 * @export
 * @interface BillingCycleTable
 * @extends {RowDataPacket}
 */
export interface BillingCycleTable extends RowDataPacket {
    /**
     * The unique identifier of the `BillingCycle`.
     *
     * @type {UUID}
     * @memberof BillingCycleTable
     */
    id: UUID;

    /**
     * The unique identifier of the customer associated with the `BillingCycle`.
     *
     * @type {UUID}
     * @memberof BillingCycleTable
     */
    customer_id: UUID;

    /**
     * The start date of the `BillingCycle`.
     *
     * @type {Date | string}
     * @memberof BillingCycleTable
     */
    starts_at: Date | string;

    /**
     * The end date of the `BillingCycle`.
     *
     * @type {Date | string}
     * @memberof BillingCycleTable
     */
    ends_at: Date | string;

    /**
     * The due date of the `BillingCycle`.
     *
     * @type {Date | string}
     * @memberof BillingCycleTable
     */
    due_at: Date | string;

    /**
     * The status of the `BillingCycle`.
     *
     * @type {string}
     * @memberof BillingCycleTable
     */
    status: string;
}
