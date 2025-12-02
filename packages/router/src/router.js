const { RadixTree } = require('./radix-tree');
const { RouteCompiler } = require('./compiler');
const equal = require('fast-deep-equal');

/**
 * Router - High-performance HTTP router for EmberAPI
 * Features:
 * - Radix tree for O(log n) route matching
 * - Pre-compiled routes for minimal overhead
 * - Separated contexts (req/res/params/query)
 * - Middleware pipeline support
 */
class Router {
    constructor() {
        this.tree = new RadixTree();
        this.compiler = new RouteCompiler();
        this.globalMiddleware = [];
        this.compiled = false;
        this.routeGroups = [];
    }

    /**
     * Add global middleware
     * @param {Function} middleware - Middleware function
     */
    plug(middleware) {
        this.globalMiddleware.push(middleware);
        return this;
    }

    /**
     * Create a route group with common prefix and middleware
     * @param {string} prefix - Route prefix
     * @param {Function} callback - Function to define routes
     * @param {...Function} middleware - Group-specific middleware
     */
    ember(prefix, callback, ...middleware) {
        const group = {
            prefix: prefix.endsWith('/') ? prefix.slice(0, -1) : prefix,
            middleware,
            routes: [],
        };

        this.routeGroups.push(group);

        // Create a scoped router for the group
        const scopedRouter = {
            get: (path, handler, ...mw) => this._addGroupRoute(group, 'GET', path, handler, mw),
            post: (path, handler, ...mw) => this._addGroupRoute(group, 'POST', path, handler, mw),
            put: (path, handler, ...mw) => this._addGroupRoute(group, 'PUT', path, handler, mw),
            delete: (path, handler, ...mw) => this._addGroupRoute(group, 'DELETE', path, handler, mw),
            patch: (path, handler, ...mw) => this._addGroupRoute(group, 'PATCH', path, handler, mw),
            options: (path, handler, ...mw) => this._addGroupRoute(group, 'OPTIONS', path, handler, mw),
            head: (path, handler, ...mw) => this._addGroupRoute(group, 'HEAD', path, handler, mw),
        };

        callback(scopedRouter);
        return this;
    }

    /**
     * Add a route to a group
     * @private
     */
    _addGroupRoute(group, method, path, handler, middleware) {
        const fullPath = group.prefix + path;
        const allMiddleware = [...group.middleware, ...middleware];
        this.tree.addRoute(method, fullPath, handler, allMiddleware);
    }

    /**
     * Register GET route
     */
    get(path, handler, ...middleware) {
        this.tree.addRoute('GET', path, handler, middleware);
        return this;
    }

    /**
     * Register POST route
     */
    post(path, handler, ...middleware) {
        this.tree.addRoute('POST', path, handler, middleware);
        return this;
    }

    /**
     * Register PUT route
     */
    put(path, handler, ...middleware) {
        this.tree.addRoute('PUT', path, handler, middleware);
        return this;
    }

    /**
     * Register DELETE route
     */
    delete(path, handler, ...middleware) {
        this.tree.addRoute('DELETE', path, handler, middleware);
        return this;
    }

    /**
     * Register PATCH route
     */
    patch(path, handler, ...middleware) {
        this.tree.addRoute('PATCH', path, handler, middleware);
        return this;
    }

    /**
     * Register OPTIONS route
     */
    options(path, handler, ...middleware) {
        this.tree.addRoute('OPTIONS', path, handler, middleware);
        return this;
    }

    /**
     * Register HEAD route
     */
    head(path, handler, ...middleware) {
        this.tree.addRoute('HEAD', path, handler, middleware);
        return this;
    }

    /**
     * Compile all routes (called automatically before first request)
     */
    forge() {
        if (this.compiled) return;

        const routes = this.tree.getRoutes();

        for (const route of routes) {
            const compiled = this.compiler.compile(route.path);
            route.compiled = compiled;
        }

        this.compiled = true;
        return this;
    }

    /**
     * Find a matching route
     * @param {string} method - HTTP method
     * @param {string} path - Request path
     * @returns {Object|null} - Route match result
     */
    find(method, path) {
        if (!this.compiled) {
            this.forge();
        }

        // Extract path without query string
        const pathOnly = path.split('?')[0];

        // Find route in radix tree
        const match = this.tree.findRoute(method, pathOnly);

        if (!match) return null;

        // Parse query string
        const query = this.compiler.parseQuery(path);

        return {
            handler: match.handler,
            params: match.params,
            query,
            middleware: [...this.globalMiddleware, ...match.middleware],
        };
    }

    /**
     * Get all registered routes
     */
    getRoutes() {
        return this.tree.getRoutes();
    }

    /**
     * Compare two objects for deep equality
     * @param {*} a - First value
     * @param {*} b - Second value
     * @returns {boolean}
     */
    static equal(a, b) {
        return equal(a, b);
    }
}

module.exports = { Router };
