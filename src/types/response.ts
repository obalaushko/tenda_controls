// deno-lint-ignore-file no-explicit-any
export type SuccessResponse = {
    status: 'success';
    ok: boolean;
    message?: string;
    data?: any;
};

export type ErrorResponse = {
    status: 'error';
    ok: boolean;
    message: string;
    error: any;
};

export type ResponseBody = SuccessResponse | ErrorResponse;

export type SuccessParams = {
    message?: string;
    data?: any;
};

export type ErrorParams = {
    message: string;
    error: any;
};

/**
 * Creates a success response object.
 *
 * @param {string} params.message - The success message.
 * @param {any} params.data - The data to include in the response.
 * @returns {SuccessResponse} The success response object.
 */
export function successResponse({
    message = '',
    data,
}: SuccessParams): SuccessResponse {
    return {
        status: 'success',
        ok: true,
        message,
        data,
    };
}

/**
 * Creates an error response object.
 * @param {ErrorParams} params - The parameters for the error response.
 * @returns {ErrorResponse} - The error response object.
 */
export function errorResponse({ message, error }: ErrorParams): ErrorResponse {
    return {
        status: 'error',
        ok: false,
        message,
        error,
    };
}