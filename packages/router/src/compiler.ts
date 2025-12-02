/**
 * 🔥 EmberAPI Router - Route Compiler
 * Pre-compiles route patterns for maximum performance
 */

import type { RouteParams, CompiledRoute, RouteHandler, Middleware } from './types';

/**
 * Compiles a route pattern into an optimized matcher function
 * Examples:
 *   /users/:id -> matches /users/123, extracts {id: "123"}
 *   /posts/:id/comments/:commentId -> extracts multiple params
 *   /files/* -> wildcard matching
 */
export function compileRoute(
    pattern: string,
    handler: RouteHandler,
    middleware: Middleware[] = []
): CompiledRoute {
    const paramNames: string[] = [];
    let regexPattern = '^';

    // Split pattern into segments
    const segments = pattern.split('/').filter(Boolean);

    for (const segment of segments) {
        if (segment.startsWith(':')) {
            // Named parameter
            const paramName = segment.slice(1);
            paramNames.push(paramName);
            regexPattern += '/([^/]+)';
        } else if (segment === '*') {
            // Wildcard
            regexPattern += '/(.*)';
            paramNames.push('*');
        } else {
            // Static segment
            regexPattern += '/' + escapeRegex(segment);
        }
    }

    regexPattern += '$';
    const regex = new RegExp(regexPattern);

    // Create optimized matcher function
    const matcher = (path: string): RouteParams | null => {
        const match = regex.exec(path);
        if (!match) return null;

        const params: RouteParams = {};
        for (let i = 0; i < paramNames.length; i++) {
            params[paramNames[i]] = decodeURIComponent(match[i + 1]);
        }

        return params;
    };

    return {
        pattern,
        handler,
        middleware,
        paramNames,
        matcher,
    };
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Parse query string into params object
 */
import { parse } from 'fast-querystring';

/**
 * Parse query string into params object
 * Uses fast-querystring for maximum performance
 */
export function parseQuery(queryString: string): Record<string, string | string[]> {
    if (!queryString) return {};
    // fast-querystring returns Record<string, any>, but we want strict typing
    return parse(queryString) as Record<string, string | string[]>;
}
