import { PricingStrategy } from "#interfaces/pricing-strategy.interface";
import { UsageData } from "#interfaces/usage-data.interface";

/**
 * A pricing strategy that applies a surcharge during peak hours.
 *
 * @export
 * @class PeakHoursTariff
 * @implements {PricingStrategy}
 */
export class PeakHoursTariff implements PricingStrategy {
    /**
     * An array of hours (in 24-hour format) that are considered peak hours for the purpose of applying a surcharge.
     *
     * @private
     * @type {number[]}
     * @memberof PeakHoursTariff
     */
    private readonly peakHours: number[] = [17, 18, 19, 20];

    /**
     * The multiplier used to calculate the surcharge during peak hours.
     * For example, a multiplier of 1.5 means a 50% increase in price during peak hours.
     *
     * @private
     * @type {number}
     * @memberof PeakHoursTariff
     */
    private readonly multiplier: number = 1.5;

    /**
     * Calculates the total price by applying a peak hour surcharge if the usage timestamp falls within the defined peak hours.
     *
     * @param {number} basePrice - The initial price before applying the peak hour surcharge.
     * @param {UsageData} usageData - The data related to the usage that may affect the pricing calculation, specifically the timestamp.
     * @returns {number} The calculated total price after applying the peak hour surcharge.
     * @memberof PeakHoursTariff
     */
    Calculate(basePrice: number, usageData: UsageData): number {
        const usageHour = usageData.timestamp.getHours();

        if (this.peakHours.includes(usageHour)) {
            return basePrice * this.multiplier;
        }

        return basePrice;
    }
}
