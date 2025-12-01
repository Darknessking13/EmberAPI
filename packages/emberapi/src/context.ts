/**
 * 🔥 EmberAPI - Context
 * Request and Response context implementations
 */

import type { RequestContext, ResponseContext } from './types';

/**
 * Create a request context from a native Request
 */
export async function createRequestContext(request: Request): Promise<RequestContext> {
    const url = new URL(request.url);

    // Parse body based on content type
    let body: any = null;
    const contentType = request.headers.get('content-type') || '';

    if (request.method !== 'GET' && request.method !== 'HEAD') {
        try {
            if (contentType.includes('application/json')) {
                body = await request.json();
            } else if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
                // For form data, just get the text for now
                body = await request.text();
            } else if (contentType.includes('text/')) {
                body = await request.text();
            } else {
                body = await request.text();
            }
        } catch (error) {
            // Body parsing failed, leave as null
        }
    }

    return {
        raw: request,
        body,
        headers: request.headers,
        url,
        method: request.method,
    };
}

/**
 * Create a response context
 */
export function createResponseContext(): ResponseContext {
    const headers = new Headers();
    let status = 200;

    const context: ResponseContext = {
        get status() {
            return status;
        },
        set status(value: number) {
            status = value;
        },
        headers,

        json(data: any, statusCode?: number): Response {
            const responseStatus = statusCode || status;
            const responseHeaders = new Headers(headers);
            responseHeaders.set('content-type', 'application/json');

            return new Response(JSON.stringify(data), {
                status: responseStatus,
                headers: responseHeaders,
            });
        },

        text(data: string, statusCode?: number): Response {
            const responseStatus = statusCode || status;
            const responseHeaders = new Headers(headers);
            responseHeaders.set('content-type', 'text/plain');

            return new Response(data, {
                status: responseStatus,
                headers: responseHeaders,
            });
        },

        html(data: string, statusCode?: number): Response {
            const responseStatus = statusCode || status;
            const responseHeaders = new Headers(headers);
            responseHeaders.set('content-type', 'text/html');

            return new Response(data, {
                status: responseStatus,
                headers: responseHeaders,
            });
        },

        send(data: any, statusCode?: number): Response {
            const responseStatus = statusCode || status;

            // Auto-detect response type
            if (typeof data === 'string') {
                if (data.trim().startsWith('<')) {
                    return context.html(data, responseStatus);
                }
                return context.text(data, responseStatus);
            }

            if (typeof data === 'object') {
                return context.json(data, responseStatus);
            }

            return context.text(String(data), responseStatus);
        },
    };

    return context;
}
