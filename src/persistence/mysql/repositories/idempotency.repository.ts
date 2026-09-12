import { Pool, ResultSetHeader } from "mysql2/promise";

import { IdempotencyRepository } from "#interfaces/repositories/idempotency.repository";
import { IdempotencyRecord } from "#interfaces/idempotency.interface";

import { IdempotencyOperation } from "#types/idempotency.type";

import { IdempotencyTable } from "#persistence/mysql/tables/idempotency.table";
import { MySqlUtilities } from "#persistence/mysql/mysql.utilities";

export class MySqlIdempotencyRepository implements IdempotencyRepository {
    constructor(private readonly pool: Pool) {}

    public async Save(record: IdempotencyRecord): Promise<void> {
        await this.pool.execute<ResultSetHeader>(
            `INSERT INTO utility_idempotency_records (
                operation,
                idempotency_key,
                request_hash,
                response_data,
                created_at,
                updated_at
            ) VALUES (?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                request_hash = VALUES(request_hash),
                response_data = VALUES(response_data),
                updated_at = VALUES(updated_at)`,
            [
                record.operation,
                record.key,
                record.requestHash,
                JSON.stringify(record.responseData),
                record.createdAt,
                record.updatedAt,
            ],
        );
    }

    public async Get(
        operation: IdempotencyOperation,
        key: string,
    ): Promise<IdempotencyRecord | undefined> {
        const [rows] = await this.pool.execute<IdempotencyTable[]>(
            `SELECT
                operation,
                idempotency_key,
                request_hash,
                response_data,
                created_at,
                updated_at
            FROM utility_idempotency_records
            WHERE operation = ? AND idempotency_key = ?`,
            [operation, key],
        );

        const row = rows[0];
        if (!row) {
            return undefined;
        }

        return {
            operation: row.operation as IdempotencyOperation,
            key: row.idempotency_key,
            requestHash: row.request_hash,
            responseData: MySqlUtilities.ParseJSON<unknown>(row.response_data),
            createdAt: MySqlUtilities.ToDate(row.created_at),
            updatedAt: MySqlUtilities.ToDate(row.updated_at),
        };
    }
}
