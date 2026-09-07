import { PricingStrategy } from "#interfaces/pricing-strategy.interface";
import { UsageData } from "#interfaces/usage-data.interface";

/**
 * This class is responsible for processing billing calculations using various pricing strategies.
 *
 * @export
 * @class BillingProcessor
 */
export class BillingProcessor {
    /**
     * An array of pricing strategies that will be applied to the base price during the billing calculation.
     *
     * @private
     * @type {PricingStrategy[]}
     * @memberof BillingProcessor
     */
    private strategies: PricingStrategy[] = [];

    /**
     * Adds a new pricing strategy to the billing processor.
     *
     * @param {PricingStrategy} strategy - The pricing strategy to be added.
     * @memberof BillingProcessor
     */
    public AddStrategy(strategy: PricingStrategy): void {
        this.strategies.push(strategy);
    }

    /**
     * Calculates the total price by applying all added pricing strategies to the base price.
     *
     * @param {number} basePrice - The initial price before applying any pricing strategies.
     * @param {UsageData} usageData - The data related to the usage that may affect the pricing calculation.
     * @returns {number} The calculated total price after applying all pricing strategies.
     * @memberof BillingProcessor
     */
    public CalculateTotal(basePrice: number, usageData: UsageData): number {
        return this.strategies.reduce((total, strategy) => {
            return strategy.Calculate(total, usageData);
        }, basePrice);
    }
}
