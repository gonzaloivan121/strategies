/**
 * Represents a generic error returned by the Utility API.
 *
 * @export
 * @class UtilityAPIError
 * @extends {Error}
 */
export class UtilityAPIError extends Error {
    /**
     * Creates an instance of `UtilityAPIError`.
     * 
     * @param {number} statusCode - The HTTP status code associated with the error.
     * @param {string} code - A machine-readable error code.
     * @param {string} message - A human-readable error message.
     * @memberof UtilityAPIError
     */
    constructor(
        public readonly statusCode: number,
        public readonly code: string,
        message: string,
    ) {
        super(message);
        this.name = this.constructor.name;
    }
}

/**
 * Represents a validation error returned by the Utility API.
 *
 * @export
 * @class ValidationError
 * @extends {UtilityAPIError}
 */
export class ValidationError extends UtilityAPIError {
    /**
     * Creates an instance of `ValidationError`.
     * 
     * @param {string} message - A human-readable error message.
     * @param {string} [code="validation_error"] - A machine-readable error code.
     * @memberof ValidationError
     */
    constructor(message: string, code = "validation_error") {
        super(400, code, message);
    }
}

/**
 * Represents a "not found" error returned by the Utility API.
 *
 * @export
 * @class NotFoundError
 * @extends {UtilityAPIError}
 */
export class NotFoundError extends UtilityAPIError {
    /**
     * Creates an instance of `NotFoundError`.
     * 
     * @param {string} message - A human-readable error message.
     * @param {string} [code="not_found"] - A machine-readable error code.
     * @memberof NotFoundError
     */
    constructor(message: string, code = "not_found") {
        super(404, code, message);
    }
}

/**
 * Represents a "conflict" error returned by the Utility API.
 *
 * @export
 * @class ConflictError
 * @extends {UtilityAPIError}
 */
export class ConflictError extends UtilityAPIError {
    /**
     * Creates an instance of `ConflictError`.
     * 
     * @param {string} message - A human-readable error message.
     * @param {string} [code="conflict"] - A machine-readable error code.
     * @memberof ConflictError
     */
    constructor(message: string, code = "conflict") {
        super(409, code, message);
    }
}
