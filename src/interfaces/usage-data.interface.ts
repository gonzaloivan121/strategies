/**
 * This interface represents the structure of usage data that is passed to the pricing strategy for calculating the total price.
 *
 * @export
 * @interface UsageData
 */
export interface UsageData {
    /**
     * The timestamp of the usage event, which is used to determine if the usage occurred during peak hours.
     *
     * @type {Date}
     * @memberof UsageData
     */
    timestamp: Date;
}