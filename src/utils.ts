/**
 * Standardized API response format
 */
export interface ApiResponse<T = any> {
    success: boolean;
    data: T | null;
    message: string;
}

export function successResponse<T>(data: T, message: string = "Success"): ApiResponse<T> {
    return {
        success: true,
        data,
        message,
    };
}

export function errorResponse(message: string, statusCode: number = 500): [Response, number] {
    return [
        new Response(
            JSON.stringify({
                success: false,
                data: null,
                message,
            }),
            {
                status: statusCode,
                headers: { "Content-Type": "application/json" },
            }
        ),
        statusCode,
    ];
}

export function jsonResponse(data: any, status: number = 200): Response {
    return new Response(JSON.stringify(data), {
        status,
        headers: { "Content-Type": "application/json" },
    });
}
