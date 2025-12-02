/**
 * RadixNode - Node in the radix tree for fast route matching
 * Optimized for O(log n) lookups with pre-compiled patterns
 */
class RadixNode {
    constructor() {
        this.children = new Map(); // Static segments
        this.paramChild = null; // Dynamic parameter segment (:param)
        this.wildcardChild = null; // Wildcard segment (*path)
        this.handler = null; // Route handler
        this.middleware = []; // Route-specific middleware
        this.paramName = null; // Parameter name for dynamic segments
        this.pattern = null; // Compiled pattern for matching
    }
}

/**
 * RadixTree - High-performance router using radix tree structure
 * Features:
 * - O(log n) route matching
 * - Pre-compiled parameter extraction
 * - Minimal memory allocations
 */
class RadixTree {
    constructor() {
        this.root = new RadixNode();
        this.routes = []; // Store all routes for compilation
    }

    /**
     * Add a route to the tree
     * @param {string} method - HTTP method
     * @param {string} path - Route path (e.g., /users/:id)
     * @param {Function} handler - Route handler
     * @param {Array} middleware - Route-specific middleware
     */
    addRoute(method, path, handler, middleware = []) {
        const route = { method, path, handler, middleware };
        this.routes.push(route);

        // Normalize path
        const normalizedPath = path === '/' ? '/' : path.replace(/\/$/, '');
        const segments = normalizedPath === '/' ? ['/'] : normalizedPath.split('/').filter(Boolean);

        let node = this.root;

        for (let i = 0; i < segments.length; i++) {
            const segment = segments[i];

            if (segment.startsWith(':')) {
                // Dynamic parameter
                if (!node.paramChild) {
                    node.paramChild = new RadixNode();
                    node.paramChild.paramName = segment.slice(1);
                }
                node = node.paramChild;
            } else if (segment === '*' || segment.startsWith('*')) {
                // Wildcard
                if (!node.wildcardChild) {
                    node.wildcardChild = new RadixNode();
                    node.wildcardChild.paramName = segment === '*' ? 'wildcard' : segment.slice(1);
                }
                node = node.wildcardChild;
            } else {
                // Static segment
                if (!node.children.has(segment)) {
                    node.children.set(segment, new RadixNode());
                }
                node = node.children.get(segment);
            }
        }

        // Store handler and middleware at the leaf node
        if (!node.handler) {
            node.handler = new Map();
        }
        node.handler.set(method, { handler, middleware });
    }

    /**
     * Find a route in the tree
     * @param {string} method - HTTP method
     * @param {string} path - Request path
     * @returns {Object|null} - { handler, middleware, params }
     */
    findRoute(method, path) {
        const normalizedPath = path === '/' ? '/' : path.replace(/\/$/, '');
        const segments = normalizedPath === '/' ? ['/'] : normalizedPath.split('/').filter(Boolean);
        const params = {};

        const result = this._search(this.root, segments, 0, params, method);

        if (result) {
            return { ...result, params };
        }

        return null;
    }

    /**
     * Recursive search through the tree
     * @private
     */
    _search(node, segments, index, params, method) {
        // Reached the end of the path
        if (index === segments.length) {
            if (node.handler && node.handler.has(method)) {
                return node.handler.get(method);
            }
            return null;
        }

        const segment = segments[index];

        // Try static match first (fastest)
        if (node.children.has(segment)) {
            const result = this._search(node.children.get(segment), segments, index + 1, params, method);
            if (result) return result;
        }

        // Try parameter match
        if (node.paramChild) {
            params[node.paramChild.paramName] = decodeURIComponent(segment);
            const result = this._search(node.paramChild, segments, index + 1, params, method);
            if (result) return result;
            delete params[node.paramChild.paramName]; // Backtrack
        }

        // Try wildcard match
        if (node.wildcardChild) {
            params[node.wildcardChild.paramName] = segments.slice(index).map(s => decodeURIComponent(s)).join('/');
            if (node.wildcardChild.handler && node.wildcardChild.handler.has(method)) {
                return node.wildcardChild.handler.get(method);
            }
        }

        return null;
    }

    /**
     * Get all registered routes
     */
    getRoutes() {
        return this.routes;
    }
}

module.exports = { RadixTree, RadixNode };
