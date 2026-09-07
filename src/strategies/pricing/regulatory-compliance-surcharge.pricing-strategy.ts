import { PricingStrategy } from "#interfaces/pricing-strategy.interface";
import { UsageData } from "#interfaces/usage-data.interface";

/**
 * A pricing strategy that applies a regulatory compliance surcharge to the base price.
 *
 * @export
 * @class RegulatoryComplianceSurcharge
 * @implements {PricingStrategy}
 */
export class RegulatoryComplianceSurcharge implements PricingStrategy {
    /**
     * The surcharge rate applied to the base price for regulatory compliance.
     * For example, a surcharge rate of 0.05 means a 5% increase in price for regulatory compliance.
     *
     * @private
     * @type {number}
     * @memberof RegulatoryComplianceSurcharge
     */
    private readonly surchargeRate: number = 0.05;

    /**
     * Calculates the total price by applying a regulatory compliance surcharge to the base price.
     *
     * @param {number} basePrice - The initial price before applying the regulatory compliance surcharge.
     * @param {UsageData} usageData - The data related to the usage that may affect the pricing calculation.
     * @returns {number} The total price after applying the regulatory compliance surcharge.
     * @memberof RegulatoryComplianceSurcharge
     */
    Calculate(basePrice: number, usageData: UsageData): number {
        return basePrice * (1 + this.surchargeRate);
    }
}
