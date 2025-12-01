/**
 * 🔥 EmberAPI - Main Application
 * Blazing fast Node.js framework with fire-themed APIs
 */

import { createServer, type Server } from 'node:http';
import { Router } from '@emberapi/router';
import type { RouteHandler, Middleware } from '@emberapi/router';
import { createRequestContext, createResponseContext } from './context';
import type { ErrorHandler } from './types';
import { parseQuery } from '@emberapi/router';

export class EmberAPI {
    private router: Router;
    private globalMiddleware: Middleware[] = [];
    private errorHandler?: ErrorHandler;
    private server?: Server;

    constructor() {
        this.router = new Router();
    }

    /**
     * 🔥 plug() - Add global middleware to the pipeline
     */
    plug(middleware: Middleware): this {
        this.globalMiddleware.push(middleware);
        return this;
    }

    /**
     * 🔥 catch() - Register global error handler
     */
    catch(handler: ErrorHandler): this {
        this.errorHandler = handler;
        return this;
    }

    /**
     * 🔥 ember() - Group routes with common prefix and middleware
     */
    ember(prefix: string, callback: (app: EmberAPI) => void, ...middleware: Middleware[]): this {
        const groupApp = new EmberAPI();
        groupApp.globalMiddleware = [...this.globalMiddleware, ...middleware];

        // Execute the callback to register routes
        callback(groupApp);

        // Copy routes from group to main router with prefix
        const routes = groupApp.router['pendingRoutes'];
        for (const route of routes) {
            const fullPattern = prefix + route.pattern;
            this.router[route.method.toLowerCase() as 'get'](
                fullPattern,
                route.handler,
                ...route.middleware
            );
        }

        return this;
    }

    /**
     * HTTP method shortcuts
     */
    get(pattern: string, handler: RouteHandler, ...middleware: Middleware[]): this {
        this.router.get(pattern, handler, ...this.globalMiddleware, ...middleware);
        return this;
    }

    post(pattern: string, handler: RouteHandler, ...middleware: Middleware[]): this {
        this.router.post(pattern, handler, ...this.globalMiddleware, ...middleware);
        return this;
    }

    put(pattern: string, handler: RouteHandler, ...middleware: Middleware[]): this {
        this.router.put(pattern, handler, ...this.globalMiddleware, ...middleware);
        return this;
    }

    delete(pattern: string, handler: RouteHandler, ...middleware: Middleware[]): this {
        this.router.delete(pattern, handler, ...this.globalMiddleware, ...middleware);
        return this;
    }

    patch(pattern: string, handler: RouteHandler, ...middleware: Middleware[]): this {
        this.router.patch(pattern, handler, ...this.globalMiddleware, ...middleware);
        return this;
    }

    options(pattern: string, handler: RouteHandler, ...middleware: Middleware[]): this {
        this.router.options(pattern, handler, ...this.globalMiddleware, ...middleware);
        return this;
    }

    head(pattern: string, handler: RouteHandler, ...middleware: Middleware[]): this {
        this.router.head(pattern, handler, ...this.globalMiddleware, ...middleware);
        return this;
    }

    /**
     * 🔥 forge() - Compile all routes (called automatically by launch)
     */
    forge(): this {
        this.router.forge();
        return this;
    }

    /**
     * Handle incoming request
     */
    private async handleRequest(request: Request): Promise<Response> {
        try {
            const url = new URL(request.url);
            const match = this.router.match(request.method, url.pathname);

            if (!match) {
                return new Response('Not Found', { status: 404 });
            }

            // Create contexts
            const req = await createRequestContext(request);
            const res = createResponseContext();

            // Parse query parameters
            const query = parseQuery(url.search.slice(1));

            // Execute middleware chain
            let middlewareIndex = 0;
            const next = async (): Promise<void> => {
                if (middlewareIndex < match.middleware.length) {
                    const middleware = match.middleware[middlewareIndex++];
                    await middleware(req, res, next);
                }
            };

            await next();

            // Execute handler
            const result = await match.handler(req, res, match.params, query);

            // If handler returns a Response, use it
            if (result instanceof Response) {
                return result;
            }

            // Otherwise, use res.send()
            return res.send(result);

        } catch (error) {
            // Handle errors
            if (this.errorHandler) {
                const req = await createRequestContext(request);
                const res = createResponseContext();
                return await this.errorHandler(error as Error, req, res);
            }

            console.error('EmberAPI Error:', error);
            return new Response('Internal Server Error', { status: 500 });
        }
    }

    /**
     * 🔥 launch() - Start the server and compile routes
     */
    launch(port: number = 3000, callback?: () => void): Server {
        // Compile routes
        this.forge();

        // Create HTTP server
        this.server = createServer(async (req, res) => {
            const url = `http://${req.headers.host}${req.url}`;

            // Read body for non-GET/HEAD requests
            let requestBody: BodyInit | null = null;
            if (req.method !== 'GET' && req.method !== 'HEAD') {
                const chunks: Buffer[] = [];
                for await (const chunk of req) {
                    chunks.push(chunk);
                }
                requestBody = Buffer.concat(chunks);
            }

            // Convert Node.js request to Web Request
            const request = new Request(url, {
                method: req.method,
                headers: req.headers as unknown as HeadersInit,
                body: requestBody,
            });

            // Handle request
            const response = await this.handleRequest(request);

            // Send response
            res.statusCode = response.status;
            response.headers.forEach((value, key) => {
                res.setHeader(key, value);
            });

            const body = await response.text();
            res.end(body);
        });

        this.server.listen(port, () => {
            console.log(`🔥 EmberAPI launched on http://localhost:${port}`);
            callback?.();
        });

        return this.server;
    }

    /**
     * Close the server
     */
    close(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.server) {
                this.server.close((err) => {
                    if (err) reject(err);
                    else resolve();
                });
            } else {
                resolve();
            }
        });
    }
}
