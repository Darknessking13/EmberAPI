const http = require('http');
const { Router } = require('@emberapi/router');
const { RequestContext, ResponseContext } = require('./context');

/**
 * EmberAPI - Blazing fast web framework
 * 
 * Features:
 * - Pre-compiled route patterns
 * - Radix tree for O(log n) route matching
 * - Separated contexts (req/res/params/query)
 * - Middleware pipeline
 */
class EmberAPI {
    constructor() {
        this.router = new Router();
        this.errorHandler = null;
        this.server = null;
    }

    /**
     * Add global middleware
     */
    plug(middleware) {
        this.router.plug(middleware);
        return this;
    }

    /**
     * Create route group
     */
    ember(prefix, callback, ...middleware) {
        this.router.ember(prefix, callback, ...middleware);
        return this;
    }

    /**
     * Register error handler
     */
    catch(handler) {
        this.errorHandler = handler;
        return this;
    }

    /**
     * Register GET route
     */
    get(path, handler, ...middleware) {
        this.router.get(path, handler, ...middleware);
        return this;
    }

    /**
     * Register POST route
     */
    post(path, handler, ...middleware) {
        this.router.post(path, handler, ...middleware);
        return this;
    }

    /**
     * Register PUT route
     */
    put(path, handler, ...middleware) {
        this.router.put(path, handler, ...middleware);
        return this;
    }

    /**
     * Register DELETE route
     */
    delete(path, handler, ...middleware) {
        this.router.delete(path, handler, ...middleware);
        return this;
    }

    /**
     * Register PATCH route
     */
    patch(path, handler, ...middleware) {
        this.router.patch(path, handler, ...middleware);
        return this;
    }

    /**
     * Register OPTIONS route
     */
    options(path, handler, ...middleware) {
        this.router.options(path, handler, ...middleware);
        return this;
    }

    /**
     * Register HEAD route
     */
    head(path, handler, ...middleware) {
        this.router.head(path, handler, ...middleware);
        return this;
    }

    /**
     * Manually compile routes
     */
    forge() {
        this.router.forge();
        return this;
    }

    /**
     * Handle incoming request
     * @private
     */
    async handleRequest(nativeReq, nativeRes) {
        try {
            // Create Web API Request
            const url = `http://${nativeReq.headers.host}${nativeReq.url}`;
            const webRequest = new Request(url, {
                method: nativeReq.method,
                headers: nativeReq.headers,
                body: nativeReq.method !== 'GET' && nativeReq.method !== 'HEAD' ? nativeReq : undefined,
                duplex: 'half', // Required for streaming bodies
            });

            // Create contexts
            const req = new RequestContext(webRequest);
            const res = new ResponseContext();

            // Find matching route
            const match = this.router.find(nativeReq.method, nativeReq.url);

            if (!match) {
                // 404 Not Found
                const response = res.json({ error: 'Not Found' }, 404);
                return this.sendResponse(nativeRes, response);
            }

            // Execute middleware chain
            let middlewareIndex = 0;
            let middlewareResponse = null;
            const next = async () => {
                if (middlewareIndex < match.middleware.length) {
                    const middleware = match.middleware[middlewareIndex++];
                    const result = await middleware(req, res, next);
                    if (result instanceof Response) {
                        middlewareResponse = result;
                    }
                }
            };

            await next();

            // If middleware returned a response, send it
            if (middlewareResponse) {
                return this.sendResponse(nativeRes, middlewareResponse);
            }

            // Execute handler
            const result = await match.handler(req, res, match.params, match.query);

            // Send response
            if (result instanceof Response) {
                this.sendResponse(nativeRes, result);
            } else if (result !== undefined) {
                const response = res.send(result);
                this.sendResponse(nativeRes, response);
            }
        } catch (error) {
            // Handle errors
            if (this.errorHandler) {
                try {
                    const res = new ResponseContext();
                    const result = await this.errorHandler(error, res);

                    if (result instanceof Response) {
                        this.sendResponse(nativeRes, result);
                    } else {
                        const response = res.json({ error: 'Internal Server Error' }, 500);
                        this.sendResponse(nativeRes, response);
                    }
                } catch (handlerError) {
                    console.error('Error in error handler:', handlerError);
                    nativeRes.writeHead(500);
                    nativeRes.end('Internal Server Error');
                }
            } else {
                console.error('Unhandled error:', error);
                nativeRes.writeHead(500);
                nativeRes.end('Internal Server Error');
            }
        }
    }

    /**
     * Send Web API Response to Node.js response
     * @private
     */
    async sendResponse(nativeRes, webResponse) {
        nativeRes.writeHead(webResponse.status, Object.fromEntries(webResponse.headers.entries()));

        if (webResponse.body) {
            const body = await webResponse.text();
            nativeRes.end(body);
        } else {
            nativeRes.end();
        }
    }

    /**
     * Start the server
     */
    launch(port = 3000, callback) {
        // Compile routes before starting
        this.forge();

        this.server = http.createServer((req, res) => {
            this.handleRequest(req, res);
        });

        this.server.listen(port, () => {
            console.log(`🔥 EmberAPI is blazing on http://localhost:${port}`);
            if (callback) callback();
        });

        return this.server;
    }

    /**
     * Stop the server
     */
    close(callback) {
        if (this.server) {
            this.server.close(callback);
        }
        return this;
    }
}

module.exports = { EmberAPI };
