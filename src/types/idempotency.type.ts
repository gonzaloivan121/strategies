/**
 * Idempotency operation for generating invoices.
 * 
 * @export
 * @type {string}
 */
export type GenerateInvoice = "GenerateInvoice";

/**
 * Idempotency operation for applying payments.
 *
 * @export
 * @type {string}
 */
export type ApplyPayment = "ApplyPayment";

/**
 * Idempotency operation types used in the utility persistence layer.
 *
 * These operations are used to ensure that certain actions, such as generating invoices or applying payments, are performed idempotently, preventing duplicate processing.
 *
 * @export
 * @type {string}
 */
export type IdempotencyOperation = GenerateInvoice | ApplyPayment;