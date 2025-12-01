/**
 * 🔥 EmberAPI Router - Radix Tree
 * O(log n) route matching using radix tree data structure
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
 * Find a matching route in the radix tree
 * Returns the handler and extracted parameters
 */
export function findRoute(
    root: RadixNode,
    method: string,
    path: string
): RouteMatch | null {
    const segments = path.split('/').filter(Boolean);
    const params: RouteParams = {};

    const result = searchNode(root, segments, 0, params, method.toUpperCase());

    if (!result) return null;

    return {
        handler: result.handler,
        params,
        middleware: result.middleware,
    };
}

/**
 * Recursively search the radix tree for a matching route
 */
function searchNode(
    node: RadixNode,
    segments: string[],
    index: number,
    params: RouteParams,
    method: string
): CompiledRoute | null {
    // Reached the end of the path
    if (index === segments.length) {
        return node.routes.get(method) || null;
    }

    const segment = segments[index];

    // Try static match first (highest priority)
    if (node.children.has(segment)) {
        const result = searchNode(
            node.children.get(segment)!,
            segments,
            index + 1,
            params,
            method
        );
        if (result) return result;
    }

    // Try parameter match
    if (node.paramChild) {
        const paramName = node.paramChild.paramName!;
        params[paramName] = decodeURIComponent(segment);

        const result = searchNode(
            node.paramChild,
            segments,
            index + 1,
            params,
            method
        );

        if (result) return result;

        // Backtrack if no match
        delete params[paramName];
    }

    // Try wildcard match (lowest priority)
    if (node.wildcardChild) {
        params['*'] = segments.slice(index).map(decodeURIComponent).join('/');
        return node.wildcardChild.routes.get(method) || null;
    }

    return null;
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
