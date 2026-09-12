export const MYSQL_UTILITY_SCHEMA_STATEMENTS: readonly string[] = [
    `CREATE TABLE IF NOT EXISTS utility_customers (
        id CHAR(36) PRIMARY KEY,
        account_number VARCHAR(100) NOT NULL,
        external_id VARCHAR(150) NOT NULL,
        full_name VARCHAR(200) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(80) NOT NULL,
        device_id CHAR(36) NOT NULL,
        notification_channels JSON NOT NULL,
        status VARCHAR(30) NOT NULL,
        service_address JSON NOT NULL,
        billing_address JSON NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY ux_utility_customers_account_number (account_number),
        UNIQUE KEY ux_utility_customers_external_id (external_id)
    )`,
    `CREATE TABLE IF NOT EXISTS utility_tariff_plans (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        currency VARCHAR(10) NOT NULL,
        base_rate_per_kwh DECIMAL(12, 6) NOT NULL,
        fixed_charge DECIMAL(12, 6) NOT NULL,
        weekend_discount_rate DECIMAL(12, 6) NOT NULL,
        regulatory_charge_per_kwh DECIMAL(12, 6) NOT NULL,
        tax_rate DECIMAL(12, 6) NOT NULL,
        peak_windows JSON NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS utility_billing_cycles (
        id CHAR(36) PRIMARY KEY,
        customer_id CHAR(36) NOT NULL,
        starts_at DATETIME NOT NULL,
        ends_at DATETIME NOT NULL,
        due_at DATETIME NOT NULL,
        status VARCHAR(30) NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX ix_utility_billing_cycles_customer_id (customer_id),
        CONSTRAINT fk_utility_billing_cycles_customer_id
            FOREIGN KEY (customer_id) REFERENCES utility_customers(id)
            ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS utility_meter_reading_batches (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        meter_id CHAR(36) NOT NULL,
        customer_id CHAR(36) NOT NULL,
        timezone VARCHAR(80) NOT NULL,
        intervals JSON NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX ix_utility_meter_reading_batches_customer_id (customer_id),
        INDEX ix_utility_meter_reading_batches_meter_id (meter_id),
        CONSTRAINT fk_utility_meter_reading_batches_customer_id
            FOREIGN KEY (customer_id) REFERENCES utility_customers(id)
            ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS utility_invoices (
        id CHAR(36) PRIMARY KEY,
        invoice_number VARCHAR(120) NOT NULL,
        customer_id CHAR(36) NOT NULL,
        billing_cycle_id CHAR(36) NOT NULL,
        issued_at DATETIME NOT NULL,
        due_at DATETIME NOT NULL,
        currency VARCHAR(10) NOT NULL,
        status VARCHAR(30) NOT NULL,
        line_items JSON NOT NULL,
        totals JSON NOT NULL,
        paid_amount DECIMAL(12, 2) NOT NULL,
        balance_due DECIMAL(12, 2) NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY ux_utility_invoices_invoice_number (invoice_number),
        INDEX ix_utility_invoices_customer_id (customer_id),
        CONSTRAINT fk_utility_invoices_customer_id
            FOREIGN KEY (customer_id) REFERENCES utility_customers(id)
            ON DELETE CASCADE,
        CONSTRAINT fk_utility_invoices_billing_cycle_id
            FOREIGN KEY (billing_cycle_id) REFERENCES utility_billing_cycles(id)
            ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS utility_payments (
        id CHAR(36) PRIMARY KEY,
        invoice_id CHAR(36) NOT NULL,
        amount DECIMAL(12, 2) NOT NULL,
        method VARCHAR(30) NOT NULL,
        status VARCHAR(30) NOT NULL,
        reference VARCHAR(150) NOT NULL,
        gateway_transaction_id VARCHAR(200) NULL,
        reason VARCHAR(255) NULL,
        created_at DATETIME NOT NULL,
        recorded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX ix_utility_payments_invoice_id (invoice_id),
        CONSTRAINT fk_utility_payments_invoice_id
            FOREIGN KEY (invoice_id) REFERENCES utility_invoices(id)
            ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS utility_idempotency_records (
        operation VARCHAR(80) NOT NULL,
        idempotency_key VARCHAR(255) NOT NULL,
        request_hash CHAR(64) NOT NULL,
        response_data JSON NOT NULL,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        PRIMARY KEY (operation, idempotency_key)
    )`,
];
