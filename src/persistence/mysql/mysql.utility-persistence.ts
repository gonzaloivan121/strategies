import { Pool, createPool } from "mysql2/promise";

import { MYSQL_UTILITY_SCHEMA_STATEMENTS } from "#persistence/mysql/mysql.utility-schema";

import { MySqlCustomerAccountRepository } from "#persistence/mysql/repositories/customer-account.repository";
import { MySqlTariffPlanRepository } from "#persistence/mysql/repositories/tariff-plan.repository";
import { MySqlBillingCycleRepository } from "#persistence/mysql/repositories/billing-cycle.repository";
import { MySqlMeterReadingRepository } from "#persistence/mysql/repositories/meter-reading.repository";
import { MySqlInvoiceRepository } from "#persistence/mysql/repositories/invoice.repository";
import { MySqlPaymentRepository } from "#persistence/mysql/repositories/payment.repository";
import { MySqlIdempotencyRepository } from "#persistence/mysql/repositories/idempotency.repository";

import { UtilityPersistence } from "#interfaces/utility-persistence.interface";
import { CustomerAccountRepository } from "#interfaces/repositories/customer-account.repository";
import { TariffPlanRepository } from "#interfaces/repositories/tariff-plan.repository";
import { BillingCycleRepository } from "#interfaces/repositories/billing-cycle.repository";
import { MeterReadingRepository } from "#interfaces/repositories/meter-reading.repository";
import { InvoiceRepository } from "#interfaces/repositories/invoice.repository";
import { PaymentRepository } from "#interfaces/repositories/payment.repository";
import { IdempotencyRepository } from "#interfaces/repositories/idempotency.repository";

/**
 * Configuration options for the MySQL utility persistence.
 *
 * @export
 * @interface MySqlUtilityPersistenceConfiguration
 */
export interface MySqlUtilityPersistenceConfiguration {
    /**
     * The hostname of the MySQL server.
     *
     * @type {string}
     * @memberof MySqlUtilityPersistenceConfiguration
     */
    host: string;

    /**
     * The port number of the MySQL server.
     *
     * @type {number}
     * @memberof MySqlUtilityPersistenceConfiguration
     */
    port: number;

    /**
     * The username for the MySQL connection.
     *
     * @type {string}
     * @memberof MySqlUtilityPersistenceConfiguration
     */
    user: string;

    /**
     * The password for the MySQL connection.
     *
     * @type {string}
     * @memberof MySqlUtilityPersistenceConfiguration
     */
    password: string;

    /**
     * The name of the MySQL database.
     *
     * @type {string}
     * @memberof MySqlUtilityPersistenceConfiguration
     */
    database: string;

    /**
     * The maximum number of connections in the MySQL connection pool.
     *
     * @type {number}
     * @memberof MySqlUtilityPersistenceConfiguration
     */
    connectionLimit?: number;
}

/**
 * MySQL implementation of the `UtilityPersistence` interface.
 *
 * @export
 * @class MySqlUtilityPersistence
 * @implements {UtilityPersistence}
 */
export class MySqlUtilityPersistence implements UtilityPersistence {
    public readonly customerAccounts: CustomerAccountRepository;
    public readonly tariffPlans: TariffPlanRepository;
    public readonly billingCycles: BillingCycleRepository;
    public readonly meterReadings: MeterReadingRepository;
    public readonly invoices: InvoiceRepository;
    public readonly payments: PaymentRepository;
    public readonly idempotency: IdempotencyRepository;

    /**
     * Creates a new instance of the MySQL utility persistence with the specified configuration.
     *
     * @static
     * @param {MySqlUtilityPersistenceConfiguration} configuration - The configuration options for the MySQL utility persistence.
     * @returns {MySqlUtilityPersistence} The newly created instance of the MySQL utility persistence.
     * @memberof MySqlUtilityPersistence
     */
    public static Create(
        configuration: MySqlUtilityPersistenceConfiguration,
    ): MySqlUtilityPersistence {
        const pool = createPool({
            host: configuration.host,
            port: configuration.port,
            user: configuration.user,
            password: configuration.password,
            database: configuration.database,
            connectionLimit: configuration.connectionLimit ?? 8,
            namedPlaceholders: false,
            decimalNumbers: true,
        });

        return new MySqlUtilityPersistence(pool);
    }

    constructor(private readonly pool: Pool) {
        this.customerAccounts = new MySqlCustomerAccountRepository(pool);
        this.tariffPlans = new MySqlTariffPlanRepository(pool);
        this.billingCycles = new MySqlBillingCycleRepository(pool);
        this.meterReadings = new MySqlMeterReadingRepository(pool);
        this.invoices = new MySqlInvoiceRepository(pool);
        this.payments = new MySqlPaymentRepository(pool);
        this.idempotency = new MySqlIdempotencyRepository(pool);
    }

    /**
     * Ensures that the necessary database schema for the MySQL utility persistence exists.
     * If the schema does not exist, it will be created.
     *
     * @returns {Promise<void>} A promise that resolves when the schema has been ensured.
     * @memberof MySqlUtilityPersistence
     */
    public async EnsureSchema(): Promise<void> {
        for (const statement of MYSQL_UTILITY_SCHEMA_STATEMENTS) {
            await this.pool.execute(statement);
        }
    }

    /**
     * Disposes of the MySQL utility persistence by closing the underlying connection pool.
     * After calling this method, the instance should not be used.
     *
     *
     * @returns {Promise<void>} A promise that resolves when the connection pool has been closed.
     * @memberof MySqlUtilityPersistence
     */
    public async Dispose(): Promise<void> {
        await this.pool.end();
    }
}
