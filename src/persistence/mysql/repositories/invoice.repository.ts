import { Pool, ResultSetHeader } from "mysql2/promise";

import { InvoiceRepository } from "#interfaces/repositories/invoice.repository";
import { Invoice } from "#interfaces/invoice.interface";

import { UUID } from "#types/uuid.type";

import { InvoiceTable } from "#persistence/mysql/tables/invoice.table";
import { MySqlUtilities } from "#persistence/mysql/mysql.utilities";

export class MySqlInvoiceRepository implements InvoiceRepository {
    constructor(private readonly pool: Pool) {}

    public async Save(invoice: Invoice): Promise<void> {
        await this.UpsertInvoice(invoice);
    }

    public async Update(invoice: Invoice): Promise<void> {
        await this.UpsertInvoice(invoice);
    }

    public async GetById(invoiceId: UUID): Promise<Invoice | undefined> {
        const [rows] = await this.pool.execute<InvoiceTable[]>(
            `SELECT
                id,
                invoice_number,
                customer_id,
                billing_cycle_id,
                issued_at,
                due_at,
                currency,
                status,
                line_items,
                totals,
                paid_amount,
                balance_due
            FROM utility_invoices
            WHERE id = ?`,
            [invoiceId],
        );

        const row = rows[0];
        return row ? this.MapInvoice(row) : undefined;
    }

    public async GetByInvoiceNumber(
        invoiceNumber: string,
    ): Promise<Invoice | undefined> {
        const [rows] = await this.pool.execute<InvoiceTable[]>(
            `SELECT
                id,
                invoice_number,
                customer_id,
                billing_cycle_id,
                issued_at,
                due_at,
                currency,
                status,
                line_items,
                totals,
                paid_amount,
                balance_due
            FROM utility_invoices
            WHERE invoice_number = ?`,
            [invoiceNumber],
        );

        const row = rows[0];
        return row ? this.MapInvoice(row) : undefined;
    }

    public async ListByCustomer(customerId: UUID): Promise<Invoice[]> {
        const [rows] = await this.pool.execute<InvoiceTable[]>(
            `SELECT
                id,
                invoice_number,
                customer_id,
                billing_cycle_id,
                issued_at,
                due_at,
                currency,
                status,
                line_items,
                totals,
                paid_amount,
                balance_due
            FROM utility_invoices
            WHERE customer_id = ?
            ORDER BY issued_at DESC`,
            [customerId],
        );

        return rows.map((row) => this.MapInvoice(row));
    }

    private async UpsertInvoice(invoice: Invoice): Promise<void> {
        await this.pool.execute<ResultSetHeader>(
            `INSERT INTO utility_invoices (
                id,
                invoice_number,
                customer_id,
                billing_cycle_id,
                issued_at,
                due_at,
                currency,
                status,
                line_items,
                totals,
                paid_amount,
                balance_due
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                invoice_number = VALUES(invoice_number),
                customer_id = VALUES(customer_id),
                billing_cycle_id = VALUES(billing_cycle_id),
                issued_at = VALUES(issued_at),
                due_at = VALUES(due_at),
                currency = VALUES(currency),
                status = VALUES(status),
                line_items = VALUES(line_items),
                totals = VALUES(totals),
                paid_amount = VALUES(paid_amount),
                balance_due = VALUES(balance_due)`,
            [
                invoice.id,
                invoice.invoiceNumber,
                invoice.customerId,
                invoice.billingCycleId,
                invoice.issuedAt,
                invoice.dueAt,
                invoice.currency,
                invoice.status,
                JSON.stringify(invoice.lineItems),
                JSON.stringify(invoice.totals),
                invoice.paidAmount,
                invoice.balanceDue,
            ],
        );
    }

    private MapInvoice(row: InvoiceTable): Invoice {
        return {
            id: row.id as UUID,
            invoiceNumber: row.invoice_number,
            customerId: row.customer_id as UUID,
            billingCycleId: row.billing_cycle_id as UUID,
            issuedAt: MySqlUtilities.ToDate(row.issued_at),
            dueAt: MySqlUtilities.ToDate(row.due_at),
            currency: row.currency,
            status: row.status as Invoice["status"],
            lineItems: MySqlUtilities.ParseJSON<Invoice["lineItems"]>(row.line_items),
            totals: MySqlUtilities.ParseJSON<Invoice["totals"]>(row.totals),
            paidAmount: MySqlUtilities.ToNumber(row.paid_amount),
            balanceDue: MySqlUtilities.ToNumber(row.balance_due),
        };
    }
}
