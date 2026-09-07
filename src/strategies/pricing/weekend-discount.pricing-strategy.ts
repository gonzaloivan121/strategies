import { PricingStrategy } from "#interfaces/pricing-strategy.interface";
import { UsageData } from "#interfaces/usage-data.interface";

/**
 * A pricing strategy that applies a discount during weekends.
 *
 * @export
 * @class WeekendDiscount
 * @implements {PricingStrategy}
 */
export class WeekendDiscount implements PricingStrategy {
    /**
     * A list of day indexes considered weekends in JavaScript Date.
     * Sunday = 0 and Saturday = 6.
     *
     * @private
     * @type {number[]}
     * @memberof WeekendDiscount
     */
    private readonly weekendDays: number[] = [0, 6];

    /**
     * The discount rate applied to the total when usage occurs during weekends.
     * For example, 0.10 means a 10% discount.
     *
     * @private
     * @type {number}
     * @memberof WeekendDiscount
     */
    private readonly discountRate: number = 0.10;

    /**
     * Calculates the total price by applying a weekend discount when eligible.
     *
     * @param {number} basePrice - The price before applying the weekend discount.
     * @param {UsageData} usageData - The usage data containing the timestamp.
     * @returns {number} The total after applying the weekend discount, if applicable.
     * @memberof WeekendDiscount
     */
    Calculate(basePrice: number, usageData: UsageData): number {
        const usageDay = usageData.timestamp.getDay();

        if (this.weekendDays.includes(usageDay)) {
            return basePrice * (1 - this.discountRate);
        }

        return basePrice;
    }
}