import { Pool, ResultSetHeader } from "mysql2/promise";

import { TariffPlanRepository } from "#interfaces/repositories/tariff-plan.repository";
import { TariffPlan } from "#interfaces/tariff-plan.interface";

import { TariffPlanTable } from "#persistence/mysql/tables/tariff-plan.table";
import { MySqlUtilities } from "#persistence/mysql/mysql.utilities";

export class MySqlTariffPlanRepository implements TariffPlanRepository {
    constructor(private readonly pool: Pool) {}

    public async Save(tariffPlan: TariffPlan): Promise<void> {
        await this.pool.execute<ResultSetHeader>(
            `INSERT INTO utility_tariff_plans (
                id,
                name,
                currency,
                base_rate_per_kwh,
                fixed_charge,
                weekend_discount_rate,
                regulatory_charge_per_kwh,
                tax_rate,
                peak_windows
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                name = VALUES(name),
                currency = VALUES(currency),
                base_rate_per_kwh = VALUES(base_rate_per_kwh),
                fixed_charge = VALUES(fixed_charge),
                weekend_discount_rate = VALUES(weekend_discount_rate),
                regulatory_charge_per_kwh = VALUES(regulatory_charge_per_kwh),
                tax_rate = VALUES(tax_rate),
                peak_windows = VALUES(peak_windows)`,
            [
                tariffPlan.id,
                tariffPlan.name,
                tariffPlan.currency,
                tariffPlan.baseRatePerKwh,
                tariffPlan.fixedCharge,
                tariffPlan.weekendDiscountRate,
                tariffPlan.regulatoryChargePerKwh,
                tariffPlan.taxRate,
                JSON.stringify(tariffPlan.peakWindows),
            ],
        );
    }

    public async GetById(
        tariffPlanId: string,
    ): Promise<TariffPlan | undefined> {
        const [rows] = await this.pool.execute<TariffPlanTable[]>(
            `SELECT
                id,
                name,
                currency,
                base_rate_per_kwh,
                fixed_charge,
                weekend_discount_rate,
                regulatory_charge_per_kwh,
                tax_rate,
                peak_windows
            FROM utility_tariff_plans
            WHERE id = ?`,
            [tariffPlanId],
        );

        const row = rows[0];
        return row ? this.MapTariffPlan(row) : undefined;
    }

    public async List(): Promise<TariffPlan[]> {
        const [rows] = await this.pool.execute<TariffPlanTable[]>(
            `SELECT
                id,
                name,
                currency,
                base_rate_per_kwh,
                fixed_charge,
                weekend_discount_rate,
                regulatory_charge_per_kwh,
                tax_rate,
                peak_windows
            FROM utility_tariff_plans
            ORDER BY created_at DESC`,
        );

        return rows.map((row) => this.MapTariffPlan(row));
    }

    private MapTariffPlan(row: TariffPlanTable): TariffPlan {
        return {
            id: row.id,
            name: row.name,
            currency: row.currency,
            baseRatePerKwh: MySqlUtilities.ToNumber(row.base_rate_per_kwh),
            fixedCharge: MySqlUtilities.ToNumber(row.fixed_charge),
            weekendDiscountRate: MySqlUtilities.ToNumber(row.weekend_discount_rate),
            regulatoryChargePerKwh: MySqlUtilities.ToNumber(row.regulatory_charge_per_kwh),
            taxRate: MySqlUtilities.ToNumber(row.tax_rate),
            peakWindows: MySqlUtilities.ParseJSON<TariffPlan["peakWindows"]>(row.peak_windows),
        };
    }
}
