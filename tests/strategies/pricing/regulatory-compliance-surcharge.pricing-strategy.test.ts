import { describe, expect, it } from "vitest";

import { RegulatoryComplianceSurcharge } from "#strategies/pricing/regulatory-compliance-surcharge.pricing-strategy";

describe("RegulatoryComplianceSurcharge", () => {
    it("adds consumption-based surcharge to the base price", () => {
        const strategy = new RegulatoryComplianceSurcharge();

        const result = strategy.Calculate(100, {
            timestamp: new Date(2024, 0, 2, 12, 0, 0),
            consumption: 40,
        });

        expect(result).toBe(102);
    });
});
