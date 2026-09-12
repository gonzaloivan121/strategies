import { Pool, ResultSetHeader } from "mysql2/promise";

import { PaymentRepository } from "#interfaces/repositories/payment.repository";
import { PaymentRecord } from "#interfaces/payment.interface";

import { UUID } from "#types/uuid.type";

import { PaymentTable } from "#persistence/mysql/tables/payment.table";
import { MySqlUtilities } from "#persistence/mysql/mysql.utilities";

export class MySqlPaymentRepository implements PaymentRepository {
    constructor(private readonly pool: Pool) {}

    public async Save(payment: PaymentRecord): Promise<void> {
        await this.pool.execute<ResultSetHeader>(
            `INSERT INTO utility_payments (
                id,
                invoice_id,
                amount,
                method,
                status,
                reference,
                gateway_transaction_id,
                reason,
                created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                invoice_id = VALUES(invoice_id),
                amount = VALUES(amount),
                method = VALUES(method),
                status = VALUES(status),
                reference = VALUES(reference),
                gateway_transaction_id = VALUES(gateway_transaction_id),
                reason = VALUES(reason),
                created_at = VALUES(created_at)`,
            [
                payment.id,
                payment.invoiceId,
                payment.amount,
                payment.method,
                payment.status,
                payment.reference,
                payment.gatewayTransactionId ?? null,
                payment.reason ?? null,
                payment.createdAt,
            ],
        );
    }

    public async ListByInvoice(invoiceId: UUID): Promise<PaymentRecord[]> {
        const [rows] = await this.pool.execute<PaymentTable[]>(
            `SELECT
                id,
                invoice_id,
                amount,
                method,
                status,
                reference,
                gateway_transaction_id,
                reason,
                created_at
            FROM utility_payments
            WHERE invoice_id = ?
            ORDER BY created_at DESC`,
            [invoiceId],
        );

        return rows.map((row) => ({
            id: row.id as UUID,
            invoiceId: row.invoice_id as UUID,
            amount: MySqlUtilities.ToNumber(row.amount),
            method: row.method as PaymentRecord["method"],
            status: row.status as PaymentRecord["status"],
            reference: row.reference,
            gatewayTransactionId: row.gateway_transaction_id ?? undefined,
            reason: row.reason ?? undefined,
            createdAt: MySqlUtilities.ToDate(row.created_at),
        }));
    }
}
