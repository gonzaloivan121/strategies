/**
 * A type representing a phone number in the format "+<country code> (<area code>) <local number>-<extension>".
 *
 * @example
 * const phone: PhoneNumber = "+1 (123) 456-7890";
 * @export
 * @type {PhoneNumber}
 */
export type PhoneNumber = `+${number} (${number}) ${number}-${number}`;
