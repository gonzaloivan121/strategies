/**
 * MySQL utility functions for common data type conversions and JSON parsing.
 *
 * @export
 * @class MySqlUtilities
 */
export class MySqlUtilities {
    /**
     * Converts a value to a `Date` object.
     *
     * @static
     * @param {(Date | string)} value - The value to convert to a `Date` object.
     * @returns {Date} The converted `Date` object.
     * @memberof MySqlUtilities
     */
    public static ToDate(value: Date | string): Date {
        return value instanceof Date ? value : new Date(value);
    }

    /**
     * Converts a value to a `number`.
     *
     * @static
     * @param {(string | number)} value - The value to convert to a `number`.
     * @returns {number} The converted `number` value.
     * @memberof MySqlUtilities
     */
    public static ToNumber(value: string | number): number {
        return typeof value === "number" ? value : Number(value);
    }

    /**
     * Parses a JSON value into the specified type `T`.
     *
     * @static
     * @template T - The type to parse the JSON value into.
     * @param {unknown} value - The JSON value to parse.
     * @returns {T} The parsed value of type `T`.
     * @memberof MySqlUtilities
     */
    public static ParseJSON<T>(value: unknown): T {
        if (typeof value === "string") {
            return JSON.parse(value) as T;
        }

        return value as T;
    }
}
