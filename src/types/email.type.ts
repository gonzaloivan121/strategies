/**
 * The local part of an email address (the part before the "@" symbol).
 * 
 * @type {string}
*/
type Local = string;

/**
 * The domain part of an email address (the part between the "@" symbol and the last ".").
 * 
 * @type {string}
 */
type Domain = string;

/**
 * The extension part of an email address (the part after the last ".").
 * 
 * @type {string}
 */
type Extension = string;

/**
 * A type representing an email address in the format of a string with a local part, an "@" symbol, and a domain part.
 * 
 * @example
 * const email: Email = "user@example.com";
 * @export
 * @type {Email}
 */
export type Email = `${Local}@${Domain}.${Extension}`;