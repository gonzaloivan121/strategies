import { PeakHour } from "#interfaces/peak-hour.interface";
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
     * An array of peak hours with their corresponding multipliers for pricing calculations.
     *
     * @private
     * @type {PeakHour[]}
     * @memberof PeakHoursTariff
     */
    private readonly peakHours: PeakHour[] = [
        { hour: 17, multiplier: 1.25 },
        { hour: 18, multiplier: 1.50 },
        { hour: 19, multiplier: 1.75 },
        { hour: 20, multiplier: 1.50 },
        { hour: 21, multiplier: 1.25 },
    ];

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

        const peakHour = this.peakHours.find(ph => ph.hour === usageHour);
        if (peakHour) {
            return basePrice * peakHour.multiplier;
        }

        return basePrice;
    }
}
