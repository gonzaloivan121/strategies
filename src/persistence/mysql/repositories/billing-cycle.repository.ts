import { Pool, ResultSetHeader } from "mysql2/promise";

import { BillingCycleRepository } from "#interfaces/repositories/billing-cycle.repository";
import { BillingCycle } from "#interfaces/billing-cycle.interface";

import { BillingCycleTable } from "#persistence/mysql/tables/billing-cycle.table";
import { MySqlUtilities } from "#persistence/mysql/mysql.utilities";

import { UUID } from "#types/uuid.type";
import { BillingCycleStatus } from "#types/billing-cycle-status.type";

export class MySqlBillingCycleRepository implements BillingCycleRepository {
    constructor(private readonly pool: Pool) {}

    public async Save(billingCycle: BillingCycle): Promise<void> {
        await this.pool.execute<ResultSetHeader>(
            `INSERT INTO utility_billing_cycles (
                id,
                customer_id,
                starts_at,
                ends_at,
                due_at,
                status
            ) VALUES (?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                customer_id = VALUES(customer_id),
                starts_at = VALUES(starts_at),
                ends_at = VALUES(ends_at),
                due_at = VALUES(due_at),
                status = VALUES(status)`,
            [
                billingCycle.id,
                billingCycle.customerId,
                billingCycle.startsAt,
                billingCycle.endsAt,
                billingCycle.dueAt,
                billingCycle.status,
            ],
        );
    }

    public async GetById(
        billingCycleId: UUID,
    ): Promise<BillingCycle | undefined> {
        const [rows] = await this.pool.execute<BillingCycleTable[]>(
            `SELECT id, customer_id, starts_at, ends_at, due_at, status
            FROM utility_billing_cycles
            WHERE id = ?`,
            [billingCycleId],
        );

        const row = rows[0];
        return row ? this.MapBillingCycle(row) : undefined;
    }

    public async ListByCustomer(customerId: UUID): Promise<BillingCycle[]> {
        const [rows] = await this.pool.execute<BillingCycleTable[]>(
            `SELECT id, customer_id, starts_at, ends_at, due_at, status
            FROM utility_billing_cycles
            WHERE customer_id = ?
            ORDER BY starts_at DESC`,
            [customerId],
        );

        return rows.map((row) => this.MapBillingCycle(row));
    }

    public async UpdateStatus(
        billingCycleId: UUID,
        status: BillingCycleStatus,
    ): Promise<void> {
        await this.pool.execute<ResultSetHeader>(
            `UPDATE utility_billing_cycles
            SET status = ?
            WHERE id = ?`,
            [status, billingCycleId],
        );
    }

    private MapBillingCycle(row: BillingCycleTable): BillingCycle {
        return {
            id: row.id as UUID,
            customerId: row.customer_id as UUID,
            startsAt: MySqlUtilities.ToDate(row.starts_at),
            endsAt: MySqlUtilities.ToDate(row.ends_at),
            dueAt: MySqlUtilities.ToDate(row.due_at),
            status: row.status as BillingCycleStatus,
        };
    }
}
