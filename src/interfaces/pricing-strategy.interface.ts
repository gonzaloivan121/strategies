import { UsageData } from "./usage-data.interface";

/**
 * This interface defines the structure for pricing strategies used in the billing processor.
 * Each strategy must implement the Calculate method, which takes a base price and usage data as input and returns the calculated total price.
 *
 * @export
 * @interface PricingStrategy
 */
export interface PricingStrategy {
    /**
     * Calculates the total price based on the provided base price and usage data.
     *
     * @param {number} basePrice - The initial price before applying any pricing strategy.
     * @param {UsageData} usageData - The data related to the usage that may affect the pricing calculation.
     * @returns {number} The calculated total price after applying the pricing strategy.
     * @memberof PricingStrategy
     */
    Calculate(basePrice: number, usageData: UsageData): number;
}