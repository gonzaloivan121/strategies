/**
 * A type representing an email address in the format of a string with a local part, an "@" symbol, and a domain part.
 * 
 * @example
 * const email: Email = "user@example.com";
 * @export
 * @type {Email}
 */
export type Email = `${string}@${string}.${string}`;