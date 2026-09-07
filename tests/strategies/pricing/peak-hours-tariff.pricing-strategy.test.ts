import { describe, expect, it } from "vitest";

import { PeakHoursTariff } from "#strategies/pricing/peak-hours-tariff.pricing-strategy";

describe("PeakHoursTariff", () => {
    it("applies a multiplier when usage occurs during a configured peak hour", () => {
        const strategy = new PeakHoursTariff();

        const result = strategy.Calculate(100, {
            timestamp: new Date(2024, 0, 2, 18, 0, 0),
            consumption: 0,
        });

        expect(result).toBe(150);
    });

    it("keeps base price unchanged when usage is outside peak hours", () => {
        const strategy = new PeakHoursTariff();

        const result = strategy.Calculate(100, {
            timestamp: new Date(2024, 0, 2, 13, 0, 0),
            consumption: 0,
        });

        expect(result).toBe(100);
    });
});
