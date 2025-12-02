const { parse } = require('fast-querystring');

/**
 * RouteCompiler - Pre-compiles routes for maximum performance
 * Features:
 * - Pre-compiled route patterns at startup
 * - Cached parameter extractors
 * - Minimal runtime overhead
 */
class RouteCompiler {
    constructor() {
        this.compiledRoutes = [];
    }

    /**
     * Compile a route pattern into an optimized matcher
     * @param {string} path - Route path pattern
     * @returns {Object} - Compiled route information
     */
    compile(path) {
        const segments = path.split('/').filter(Boolean);
        const paramNames = [];
        const pattern = [];

        for (const segment of segments) {
            if (segment.startsWith(':')) {
                paramNames.push(segment.slice(1));
                pattern.push({ type: 'param', name: segment.slice(1) });
            } else if (segment === '*' || segment.startsWith('*')) {
                const name = segment === '*' ? 'wildcard' : segment.slice(1);
                paramNames.push(name);
                pattern.push({ type: 'wildcard', name });
            } else {
                pattern.push({ type: 'static', value: segment });
            }
        }

        return {
            path,
            paramNames,
            pattern,
            segmentCount: segments.length,
        };
    }

    /**
     * Extract parameters from a path using compiled pattern
     * @param {Array} pattern - Compiled pattern
     * @param {Array} segments - Path segments
     * @returns {Object} - Extracted parameters
     */
    extractParams(pattern, segments) {
        const params = {};

        for (let i = 0; i < pattern.length; i++) {
            const part = pattern[i];

            if (part.type === 'param') {
                params[part.name] = decodeURIComponent(segments[i]);
            } else if (part.type === 'wildcard') {
                params[part.name] = segments.slice(i).map(s => decodeURIComponent(s)).join('/');
                break;
            }
        }

        return params;
    }

    /**
     * Parse query string from URL
     * @param {string} url - Full URL or query string
     * @returns {Object} - Parsed query parameters
     */
    parseQuery(url) {
        const queryIndex = url.indexOf('?');
        if (queryIndex === -1) return {};

        const queryString = url.slice(queryIndex + 1);
        return parse(queryString);
    }
}

module.exports = { RouteCompiler };
