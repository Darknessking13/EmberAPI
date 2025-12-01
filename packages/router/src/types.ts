/**
 * 🔥 EmberAPI Router - Types
 * High-performance routing with radix tree and pre-compiled patterns
 */

export interface RouteParams {
    [key: string]: string;
}

export interface QueryParams {
    [key: string]: string | string[];
}

export interface RouteHandler {
    (req: any, res: any, params: RouteParams, query: QueryParams): any;
}

export interface Middleware {
    (req: any, res: any, next: () => void | Promise<void>): void | Promise<void>;
}

export interface CompiledRoute {
    pattern: string;
    handler: RouteHandler;
    middleware: Middleware[];
    paramNames: string[];
    matcher: (path: string) => RouteParams | null;
}

export interface RadixNode {
    path: string;
    children: Map<string, RadixNode>;
    routes: Map<string, CompiledRoute>; // method -> route
    paramChild?: RadixNode;
    wildcardChild?: RadixNode;
    paramName?: string;
}

export interface RouteMatch {
    handler: RouteHandler;
    params: RouteParams;
    middleware: Middleware[];
}
