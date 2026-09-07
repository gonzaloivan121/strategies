/**
 * A type representing a UUID (Universally Unique Identifier) in the format of a string with five segments separated by hyphens.
 * 
 * @example
 * const uuid: UUID = "123e4567-e89b-12d3-a456-426614174000";
 * @export
 * @type {UUID}
 */
export type UUID = `${string}-${string}-${string}-${string}-${string}`;