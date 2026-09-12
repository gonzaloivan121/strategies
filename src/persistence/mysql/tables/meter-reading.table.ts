import { RowDataPacket } from "mysql2/promise";

import { UUID } from "#types/uuid.type";

/**
 * Represents a row in the `meter_readings` table.
 *
 * @export
 * @interface MeterReadingTable
 * @extends {RowDataPacket}
 */
export interface MeterReadingTable extends RowDataPacket {
    /**
     * The unique identifier of the `Meter`.
     *
     * @type {UUID}
     * @memberof MeterReadingTable
     */
    meter_id: UUID;

    /**
     * The unique identifier of the `Customer`.
     *
     * @type {UUID}
     * @memberof MeterReadingTable
     */
    customer_id: UUID;

    /**
     * The timezone of the `MeterReading` intervals.
     *
     * @type {string}
     * @memberof MeterReadingTable
     */
    timezone: string;

    /**
     * The intervals of the `MeterReading`.
     *
     * @type {string}
     * @memberof MeterReadingTable
     */
    intervals: string;
}
