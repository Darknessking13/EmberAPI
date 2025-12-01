/**
 * 🔥 EmberAPI Router - Main Router Class
 * High-performance router with radix tree
 */

import type { RouteHandler, Middleware, RouteMatch } from './types';
import { compileRoute } from './compiler';
import { createNode, insertRoute, findRoute, getAllRoutes } from './radix-tree';
import type { RadixNode } from './types';

export class Router {
    private root: RadixNode;
    private compiled: boolean = false;

    // Pending routes to be compiled
    private pendingRoutes: Array<{
        method: string;
        pattern: string;
        handler: RouteHandler;
        middleware: Middleware[];
    }> = [];

    constructor() {
        this.root = createNode();
    }

    /**
     * Register a route (will be compiled later)
     */
    private addRoute(
        method: string,
        pattern: string,
        handler: RouteHandler,
        middleware: Middleware[] = []
    ): this {
        this.pendingRoutes.push({ method, pattern, handler, middleware });
        this.compiled = false;
        return this;
    }

    /**
     * HTTP method shortcuts
     */
    get(pattern: string, handler: RouteHandler, ...middleware: Middleware[]): this {
        return this.addRoute('GET', pattern, handler, middleware);
    }

    post(pattern: string, handler: RouteHandler, ...middleware: Middleware[]): this {
        return this.addRoute('POST', pattern, handler, middleware);
    }

    put(pattern: string, handler: RouteHandler, ...middleware: Middleware[]): this {
        return this.addRoute('PUT', pattern, handler, middleware);
    }

    delete(pattern: string, handler: RouteHandler, ...middleware: Middleware[]): this {
        return this.addRoute('DELETE', pattern, handler, middleware);
    }

    patch(pattern: string, handler: RouteHandler, ...middleware: Middleware[]): this {
        return this.addRoute('PATCH', pattern, handler, middleware);
    }

    options(pattern: string, handler: RouteHandler, ...middleware: Middleware[]): this {
        return this.addRoute('OPTIONS', pattern, handler, middleware);
    }

    head(pattern: string, handler: RouteHandler, ...middleware: Middleware[]): this {
        return this.addRoute('HEAD', pattern, handler, middleware);
    }

    /**
     * Compile all pending routes into the radix tree
     * This should be called before the server starts
     */
    forge(): this {
        if (this.compiled) return this;

        // Clear the tree
        this.root = createNode();

        // Compile and insert all routes
        for (const { method, pattern, handler, middleware } of this.pendingRoutes) {
            const compiled = compileRoute(pattern, handler, middleware);
            insertRoute(this.root, method, compiled);
        }

        this.compiled = true;
        return this;
    }

    /**
     * Find a matching route for the given method and path
     */
    match(method: string, path: string): RouteMatch | null {
        if (!this.compiled) {
            this.forge();
        }

        return findRoute(this.root, method, path);
    }

    /**
     * Get all registered routes (for debugging)
     */
    routes(): Array<{ method: string; pattern: string }> {
        if (!this.compiled) {
            this.forge();
        }

        return getAllRoutes(this.root);
    }
}
