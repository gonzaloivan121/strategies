import { describe, expect, it } from "vitest";

import { WeekendDiscount } from "#strategies/pricing/weekend-discount.pricing-strategy";

describe("WeekendDiscount", () => {
    it("applies a discount for saturday usage", () => {
        const strategy = new WeekendDiscount();

        const result = strategy.Calculate(100, {
            timestamp: new Date(2024, 0, 6, 9, 0, 0),
            consumption: 0,
        });

        expect(result).toBe(90);
    });

    it("keeps base price unchanged on weekdays", () => {
        const strategy = new WeekendDiscount();

        const result = strategy.Calculate(100, {
            timestamp: new Date(2024, 0, 8, 9, 0, 0),
            consumption: 0,
        });

        expect(result).toBe(100);
    });
});
