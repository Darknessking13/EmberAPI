/**
 * 🔥 EmberAPI Router - Optimized Radix Tree
 * O(log n) route matching with strategic optimizations
 */

import type { RadixNode, CompiledRoute, RouteMatch, RouteParams } from './types';

/**
 * Create a new radix tree node
 */
export function createNode(path: string = ''): RadixNode {
    return {
        path,
        children: new Map(),
        routes: new Map(),
    };
}

/**
 * Insert a compiled route into the radix tree
 */
export function insertRoute(
    root: RadixNode,
    method: string,
    route: CompiledRoute
): void {
    const segments = route.pattern.split('/').filter(Boolean);
    let node = root;

    for (const segment of segments) {
        if (segment.startsWith(':')) {
            // Parameter segment
            if (!node.paramChild) {
                node.paramChild = createNode(segment);
                node.paramChild.paramName = segment.slice(1);
            }
            node = node.paramChild;
        } else if (segment === '*') {
            // Wildcard segment
            if (!node.wildcardChild) {
                node.wildcardChild = createNode('*');
            }
            node = node.wildcardChild;
        } else {
            // Static segment
            if (!node.children.has(segment)) {
                node.children.set(segment, createNode(segment));
            }
            node = node.children.get(segment)!;
        }
    }

    // Store the route at the final node
    node.routes.set(method.toUpperCase(), route);
}

/**
 * Find a matching route in the radix tree (OPTIMIZED)
 * Strategic optimizations for both small and large route sets
 */
export function findRoute(
    root: RadixNode,
    method: string,
    path: string
): RouteMatch | null {
    const methodUpper = method.toUpperCase();

    // Fast path for root (most common case)
    if (path === '/' || path === '') {
        const route = root.routes.get(methodUpper);
        return route ? { handler: route.handler, params: {}, middleware: route.middleware } : null;
    }

    // Optimized path splitting - avoid array allocations when possible
    const pathLen = path.length;
    let segmentCount = 0;

    // Count segments first (avoids array resizing)
    for (let i = 1; i < pathLen; i++) {
        if (path.charCodeAt(i) === 47) segmentCount++; // 47 = '/'
    }
    if (pathLen > 1) segmentCount++; // Last segment

    // Pre-allocate array with exact size
    const segments = new Array(segmentCount);
    let segIdx = 0;
    let start = 1;

    for (let i = 1; i <= pathLen; i++) {
        if (i === pathLen || path.charCodeAt(i) === 47) {
            if (i > start) {
                segments[segIdx++] = path.substring(start, i);
            }
            start = i + 1;
        }
    }

    // Fast path for single segment (common case: /users, /health, etc.)
    if (segmentCount === 1) {
        const segment = segments[0];

        // Try static match
        const staticChild = root.children.get(segment);
        if (staticChild) {
            const route = staticChild.routes.get(methodUpper);
            if (route) {
                return { handler: route.handler, params: {}, middleware: route.middleware };
            }
        }

        // Try param match
        if (root.paramChild) {
            const route = root.paramChild.routes.get(methodUpper);
            if (route) {
                const params: RouteParams = {};
                params[root.paramChild.paramName!] = segment.indexOf('%') === -1 ? segment : decodeURIComponent(segment);
                return { handler: route.handler, params, middleware: route.middleware };
            }
        }

        // Try wildcard
        if (root.wildcardChild) {
            const route = root.wildcardChild.routes.get(methodUpper);
            if (route) {
                const params: RouteParams = { '*': segment.indexOf('%') === -1 ? segment : decodeURIComponent(segment) };
                return { handler: route.handler, params, middleware: route.middleware };
            }
        }

        return null;
    }

    // General case: multiple segments
    const params: RouteParams = {};
    let node = root;
    let segmentIndex = 0;

    // Pre-allocate stack with reasonable size (most routes are < 10 levels deep)
    const stack: Array<{ node: RadixNode; index: number; paramName?: string }> = new Array(10);
    let stackSize = 0;

    while (true) {
        // Reached the end of the path
        if (segmentIndex === segmentCount) {
            const route = node.routes.get(methodUpper);
            if (route) {
                return { handler: route.handler, params, middleware: route.middleware };
            }

            // Backtrack
            if (stackSize === 0) return null;
            const state = stack[--stackSize];
            if (state.paramName) {
                delete params[state.paramName];
            }
            node = state.node;
            segmentIndex = state.index;
            continue;
        }

        const segment = segments[segmentIndex];

        // Try static match first (highest priority, fastest)
        const staticChild = node.children.get(segment);
        if (staticChild) {
            node = staticChild;
            segmentIndex++;
            continue;
        }

        // Try parameter match
        if (node.paramChild) {
            const paramName = node.paramChild.paramName!;
            params[paramName] = segment.indexOf('%') === -1 ? segment : decodeURIComponent(segment);

            // Grow stack if needed (rare)
            if (stackSize >= stack.length) {
                stack.push({ node: node.paramChild, index: segmentIndex + 1, paramName });
                stackSize++;
            } else {
                stack[stackSize++] = { node: node.paramChild, index: segmentIndex + 1, paramName };
            }

            node = node.paramChild;
            segmentIndex++;
            continue;
        }

        // Try wildcard match (lowest priority)
        if (node.wildcardChild) {
            // Optimized wildcard path joining
            let wildcardPath: string;
            const remaining = segmentCount - segmentIndex;

            if (remaining === 1) {
                wildcardPath = segment;
            } else {
                // Pre-calculate total length to avoid string reallocation
                let totalLen = segment.length;
                for (let i = segmentIndex + 1; i < segmentCount; i++) {
                    totalLen += 1 + segments[i].length; // +1 for '/'
                }

                // Build string in one go
                const parts = new Array(remaining);
                parts[0] = segment;
                for (let i = 1; i < remaining; i++) {
                    parts[i] = segments[segmentIndex + i];
                }
                wildcardPath = parts.join('/');
            }

            params['*'] = wildcardPath.indexOf('%') === -1 ? wildcardPath : decodeURIComponent(wildcardPath);

            const route = node.wildcardChild.routes.get(methodUpper);
            if (route) {
                return { handler: route.handler, params, middleware: route.middleware };
            }
        }

        // No match found, backtrack
        if (stackSize === 0) return null;
        const state = stack[--stackSize];
        if (state.paramName) {
            delete params[state.paramName];
        }
        node = state.node;
        segmentIndex = state.index;
    }
}

/**
 * Get all routes from the tree (for debugging/inspection)
 */
export function getAllRoutes(root: RadixNode): Array<{
    method: string;
    pattern: string;
}> {
    const routes: Array<{ method: string; pattern: string }> = [];

    function traverse(node: RadixNode) {
        for (const [method, route] of node.routes) {
            routes.push({ method, pattern: route.pattern });
        }

        for (const child of node.children.values()) {
            traverse(child);
        }

        if (node.paramChild) traverse(node.paramChild);
        if (node.wildcardChild) traverse(node.wildcardChild);
    }

    traverse(root);
    return routes;
}
