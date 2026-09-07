import { describe, expect, it, vi } from "vitest";

import { BillingProcessor } from "#processors/billing/billing.processor";
import type { PricingStrategy } from "#interfaces/pricing-strategy.interface";
import type { UsageData } from "#interfaces/usage-data.interface";

describe("BillingProcessor", () => {
    const usageData: UsageData = {
        timestamp: new Date(2024, 0, 2, 12, 0, 0),
        consumption: 50,
    };

    it("returns base price when no strategies are registered", () => {
        const processor = new BillingProcessor();

        expect(processor.CalculateTotal(100, usageData)).toBe(100);
    });

    it("applies strategies in the order they were added", () => {
        const processor = new BillingProcessor();

        const firstStrategy = {
            Calculate: vi.fn((basePrice: number) => basePrice + 10),
        } satisfies PricingStrategy;

        const secondStrategy = {
            Calculate: vi.fn((basePrice: number) => basePrice * 2),
        } satisfies PricingStrategy;

        processor.AddStrategy(firstStrategy);
        processor.AddStrategy(secondStrategy);

        const result = processor.CalculateTotal(100, usageData);

        expect(result).toBe(220);
        expect(firstStrategy.Calculate).toHaveBeenCalledOnce();
        expect(firstStrategy.Calculate).toHaveBeenCalledWith(100, usageData);
        expect(secondStrategy.Calculate).toHaveBeenCalledOnce();
        expect(secondStrategy.Calculate).toHaveBeenCalledWith(110, usageData);
    });
});
