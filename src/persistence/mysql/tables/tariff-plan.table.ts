import { RowDataPacket } from "mysql2/promise";

import { UUID } from "#types/uuid.type";

/**
 * Represents a row in the `tariff_plans` table.
 *
 * @export
 * @interface TariffPlanTable
 * @extends {RowDataPacket}
 */
export interface TariffPlanTable extends RowDataPacket {
    /**
     * The unique identifier of the `TariffPlan`.
     *
     * @type {UUID}
     * @memberof TariffPlanTable
     */
    id: UUID;

    /**
     * The name of the `TariffPlan`.
     *
     * @type {string}
     * @memberof TariffPlanTable
     */
    name: string;

    /**
     * The currency of the `TariffPlan`.
     *
     * @type {string}
     * @memberof TariffPlanTable
     */
    currency: string;

    /**
     * The base rate per kWh of the `TariffPlan`.
     *
     * @type {(string | number)}
     * @memberof TariffPlanTable
     */
    base_rate_per_kwh: string | number;

    /**
     * The fixed charge of the `TariffPlan`.
     *
     * @type {(string | number)}
     * @memberof TariffPlanTable
     */
    fixed_charge: string | number;

    /**
     * The weekend discount rate of the `TariffPlan`.
     *
     * @type {(string | number)}
     * @memberof TariffPlanTable
     */
    weekend_discount_rate: string | number;

    /**
     * The regulatory charge per kWh of the `TariffPlan`.
     *
     * @type {(string | number)}
     * @memberof TariffPlanTable
     */
    regulatory_charge_per_kwh: string | number;

    /**
     * The tax rate of the `TariffPlan`.
     *
     * @type {(string | number)}
     * @memberof TariffPlanTable
     */
    tax_rate: string | number;

    /**
     * The peak windows of the `TariffPlan`.
     *
     * @type {string}
     * @memberof TariffPlanTable
     */
    peak_windows: string;
}
