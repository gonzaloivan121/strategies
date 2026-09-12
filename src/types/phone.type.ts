/**
 * The country code part of a phone number.
 *
 * @type {number}
 */
type CountryCode = number;

/**
 * The area code part of a phone number.
 *
 * @type {number}
 */
type AreaCode = number;

/**
 * The local number part of a phone number.
 *
 * @type {number}
 */
type LocalNumber = number;

/**
 * The extension part of a phone number.
 *
 * @type {number}
 */
type Extension = number;

/**
 * A type representing a phone number in the format "+<country code> (<area code>) <local number>-<extension>".
 *
 * @example
 * const phone: USPhoneNumber = "+1 (123) 456-7890";
 * @export
 * @type {PhoneNumber}
 */
export type USPhoneNumber = `+${CountryCode} (${AreaCode}) ${LocalNumber}-${Extension}`;

/**
 * A type representing a short phone number in the format "({area code}) {local number}-{extension}".
 *
 * @example
 * const phone: ShortPhoneNumber = "(123) 456-7890";
 * @export
 * @type {ShortPhoneNumber}
 */
export type ShortPhoneNumber = `(${AreaCode}) ${LocalNumber}-${Extension}`;

/**
 * A type representing an international phone number in the format "+<country code> <local number>".
 * 
 * @example
 * const phone: InternationalPhoneNumber = "+1 456";
 * @export
 * @type {InternationalPhoneNumber}
 */
export type InternationalPhoneNumber = `+${CountryCode} ${LocalNumber}`;

/**
 * A type representing a standard phone number in the format "+<country code><area code><local number>".
 *
 * @example
 * const phone: PhoneNumber = "+11234567890";
 * @export
 * @type {PhoneNumber}
 */
export type PhoneNumber = `+${CountryCode}${AreaCode}${LocalNumber}`;