/**
 * 🔥 EmberAPI - Types
 * Core type definitions for the framework
 */

import type { RouteHandler, Middleware, RouteParams, QueryParams } from '@emberapi/router';

/**
 * Request Context
 * Contains parsed request information
 */
export interface RequestContext {
    raw: Request;
    body: any;
    headers: Headers;
    url: URL;
    method: string;
}

/**
 * Response Context
 * Provides convenient response methods
 */
export interface ResponseContext {
    status: number;
    headers: Headers;
    json(data: any, status?: number): Response;
    text(data: string, status?: number): Response;
    html(data: string, status?: number): Response;
    send(data: any, status?: number): Response;
}

/**
 * Error Handler
 */
export interface ErrorHandler {
    (error: Error, req: RequestContext, res: ResponseContext): Response | Promise<Response>;
}

/**
 * Group Configuration
 */
export interface GroupConfig {
    prefix: string;
    middleware: Middleware[];
}

// Re-export router types
export type { RouteHandler, Middleware, RouteParams, QueryParams };
