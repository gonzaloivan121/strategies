import { Pool, ResultSetHeader } from "mysql2/promise";

import { MeterReadingRepository } from "#interfaces/repositories/meter-reading.repository";
import { MeterReadingBatch } from "#interfaces/meter-reading.interface";

import { UUID } from "#types/uuid.type";

import { MeterReadingTable } from "#persistence/mysql/tables/meter-reading.table";
import { MySqlUtilities } from "#persistence/mysql/mysql.utilities";

export class MySqlMeterReadingRepository implements MeterReadingRepository {
    constructor(private readonly pool: Pool) {}

    public async SaveBatch(readingBatch: MeterReadingBatch): Promise<void> {
        await this.pool.execute<ResultSetHeader>(
            `INSERT INTO utility_meter_reading_batches (
                meter_id,
                customer_id,
                timezone,
                intervals
            ) VALUES (?, ?, ?, ?)`,
            [
                readingBatch.meterId,
                readingBatch.customerId,
                readingBatch.timezone,
                JSON.stringify(readingBatch.intervals),
            ],
        );
    }

    public async GetBatchesForCustomer(
        customerId: UUID,
    ): Promise<MeterReadingBatch[]> {
        const [rows] = await this.pool.execute<MeterReadingTable[]>(
            `SELECT meter_id, customer_id, timezone, intervals
            FROM utility_meter_reading_batches
            WHERE customer_id = ?
            ORDER BY created_at ASC`,
            [customerId],
        );

        return rows.map((row) => ({
            meterId: row.meter_id as UUID,
            customerId: row.customer_id as UUID,
            timezone: row.timezone,
            intervals: MySqlUtilities.ParseJSON<MeterReadingBatch["intervals"]>(row.intervals).map(
                (interval) => ({
                    ...interval,
                    startedAt: MySqlUtilities.ToDate(interval.startedAt),
                    endedAt: MySqlUtilities.ToDate(interval.endedAt),
                }),
            ),
        }));
    }
}