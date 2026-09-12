import { Pool, ResultSetHeader } from "mysql2/promise";

import { CustomerAccountRepository } from "#interfaces/repositories/customer-account.repository";
import { CustomerAccount } from "#interfaces/customer-account.interface";

import { UUID } from "#types/uuid.type";

import { CustomerAccountTable } from "#persistence/mysql/tables/customer-account.table";
import { MySqlUtilities } from "#persistence/mysql/mysql.utilities";

export class MySqlCustomerAccountRepository implements CustomerAccountRepository {
    constructor(private readonly pool: Pool) {}

    public async Save(customerAccount: CustomerAccount): Promise<void> {
        await this.pool.execute<ResultSetHeader>(
            `INSERT INTO utility_customers (
                id,
                account_number,
                external_id,
                full_name,
                email,
                phone,
                device_id,
                notification_channels,
                status,
                service_address,
                billing_address
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                account_number = VALUES(account_number),
                external_id = VALUES(external_id),
                full_name = VALUES(full_name),
                email = VALUES(email),
                phone = VALUES(phone),
                device_id = VALUES(device_id),
                notification_channels = VALUES(notification_channels),
                status = VALUES(status),
                service_address = VALUES(service_address),
                billing_address = VALUES(billing_address)`,
            [
                customerAccount.id,
                customerAccount.accountNumber,
                customerAccount.externalId,
                customerAccount.fullName,
                customerAccount.email,
                customerAccount.phone,
                customerAccount.deviceId,
                JSON.stringify(customerAccount.notificationChannels),
                customerAccount.status,
                JSON.stringify(customerAccount.serviceAddress),
                JSON.stringify(customerAccount.billingAddress),
            ],
        );
    }

    public async GetById(
        customerId: UUID,
    ): Promise<CustomerAccount | undefined> {
        const [rows] = await this.pool.execute<CustomerAccountTable[]>(
            `SELECT
                id,
                account_number,
                external_id,
                full_name,
                email,
                phone,
                device_id,
                notification_channels,
                status,
                service_address,
                billing_address
            FROM utility_customers
            WHERE id = ?`,
            [customerId],
        );

        const row = rows[0];
        return row ? this.MapCustomerAccount(row) : undefined;
    }

    public async List(): Promise<CustomerAccount[]> {
        const [rows] = await this.pool.execute<CustomerAccountTable[]>(
            `SELECT
                id,
                account_number,
                external_id,
                full_name,
                email,
                phone,
                device_id,
                notification_channels,
                status,
                service_address,
                billing_address
            FROM utility_customers
            ORDER BY created_at DESC`,
        );

        return rows.map((row) => this.MapCustomerAccount(row));
    }

    private MapCustomerAccount(row: CustomerAccountTable): CustomerAccount {
        return {
            id: row.id as UUID,
            accountNumber: row.account_number,
            externalId: row.external_id,
            fullName: row.full_name,
            email: row.email as CustomerAccount["email"],
            phone: row.phone as CustomerAccount["phone"],
            deviceId: row.device_id as UUID,
            notificationChannels: MySqlUtilities.ParseJSON<
                CustomerAccount["notificationChannels"]
            >(row.notification_channels),
            status: row.status as CustomerAccount["status"],
            serviceAddress: MySqlUtilities.ParseJSON<CustomerAccount["serviceAddress"]>(
                row.service_address,
            ),
            billingAddress: MySqlUtilities.ParseJSON<CustomerAccount["billingAddress"]>(
                row.billing_address,
            ),
        };
    }
}
