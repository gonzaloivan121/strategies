/**
 * Represents a peak hour with its corresponding multiplier for pricing calculations.
 *
 * @export
 * @interface PeakHour
 */
export interface PeakHour {
    /**
     * The hour of the day (in 24-hour format) that is considered a peak hour.
     *
     * @type {number}
     * @memberof PeakHour
     */
    hour: number;

    /**
     * The multiplier applied to the base price during this peak hour.
     *
     * @type {number}
     * @memberof PeakHour
     */
    multiplier: number;
}
