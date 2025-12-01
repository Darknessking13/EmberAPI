# 🔥 EmberAPI - Project Summary

## Overview

**EmberAPI** is a blazing fast Node.js web framework with fire-themed APIs, built as a monorepo using Turborepo. It features high-performance routing with a radix tree data structure and pre-compiled route patterns.

## Project Structure

```
EmberAPI/
├── packages/
│   ├── router/              # @emberapi/router - Standalone routing library
│   │   ├── src/
│   │   │   ├── types.ts     # Type definitions
│   │   │   ├── compiler.ts  # Route pattern compiler
│   │   │   ├── radix-tree.ts # Radix tree implementation
│   │   │   ├── router.ts    # Main Router class
│   │   │   └── index.ts     # Package exports
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── emberapi/            # Main framework package
│       ├── src/
│       │   ├── types.ts     # Framework type definitions
│       │   ├── context.ts   # Request/Response contexts
│       │   ├── emberapi.ts  # Main EmberAPI class
│       │   └── index.ts     # Package exports
│       ├── package.json
│       └── tsconfig.json
│
├── examples/
│   └── basic/               # Example application
│       ├── src/
│       │   └── index.ts     # Demo app with all features
│       ├── package.json
│       └── tsconfig.json
│
├── package.json             # Root package.json (monorepo)
├── turbo.json              # Turborepo configuration
├── tsconfig.json           # Root TypeScript config
└── README.md               # Documentation

```

## Key Features

### 🔥 Fire-Themed API
- `launch(port)` - Start the server (instead of `listen`)
- `plug(middleware)` - Add middleware (instead of `use`)
- `catch(handler)` - Error handling (instead of `onError`)
- `ember(prefix, callback)` - Route grouping (instead of `group`)
- `forge()` - Compile routes (manual compilation)

### ⚡ High Performance
- **Pre-compiled routes**: Route patterns are compiled at startup, not on every request
- **Radix tree routing**: O(log n) route matching instead of O(n)
- **Separated contexts**: Minimal memory overhead with separate req/res/params/query objects
- **Native Web APIs**: Uses native Request/Response objects for zero-copy operations

### 📦 Monorepo Architecture
- **@emberapi/router**: Standalone routing library that can be used independently
- **emberapi**: Main framework that uses the router
- **Turborepo**: Fast builds with intelligent caching
- **Workspace dependencies**: Packages reference each other using `workspace:*`

## Architecture Highlights

### Route Compiler
- Converts route patterns like `/users/:id` into optimized matcher functions
- Extracts parameter names at compile time
- Caches regex patterns for reuse
- Supports static segments, parameters (`:id`), and wildcards (`*`)

### Radix Tree
- Efficient tree structure for route matching
- Prioritizes static routes over dynamic routes
- Supports parameter and wildcard matching
- O(log n) lookup time

### Request/Response Contexts
- **Request Context**: Parsed body, headers, URL, method
- **Response Context**: Convenient methods like `json()`, `text()`, `html()`, `send()`
- Auto-detection of response type in `send()`

## API Examples

### Basic Server
```typescript
import { EmberAPI } from 'emberapi';

const app = new EmberAPI();

app.get('/', (req, res) => {
  return res.json({ message: 'Hello EmberAPI! 🔥' });
});

app.launch(3000);
```

### Route Parameters
```typescript
app.get('/users/:id', (req, res, params) => {
  return res.json({ userId: params.id });
});
```

### Middleware
```typescript
app.plug((req, res, next) => {
  console.log(`${req.method} ${req.url.pathname}`);
  next();
});
```

### Route Grouping
```typescript
app.ember('/api/v1', (api) => {
  api.get('/users', (req, res) => {
    return res.json({ users: [] });
  });
  
  api.get('/posts', (req, res) => {
    return res.json({ posts: [] });
  });
});
```

### Error Handling
```typescript
app.catch((error, req, res) => {
  console.error(error);
  return res.json({ error: error.message }, 500);
});
```

## Build System

### Turborepo
- Parallel builds across packages
- Intelligent caching
- Task dependencies (router builds before emberapi)

### TypeScript + tsup
- Full type safety
- Generates CJS, ESM, and TypeScript declarations
- Fast builds with esbuild

## Commands

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm run build

# Watch mode (development)
pnpm run dev

# Run example
cd examples/basic
pnpm run dev

# Clean build artifacts
pnpm run clean
```

## Performance Optimizations

1. **Pre-compilation**: Routes are compiled once at startup
2. **Radix tree**: O(log n) route matching
3. **Minimal overhead**: Separated contexts reduce memory usage
4. **Native APIs**: Zero-copy operations with Web Request/Response
5. **Efficient middleware**: Pre-composed middleware chains

## Type Safety

- Full TypeScript support
- Exported types for all APIs
- Type-safe route handlers
- Middleware type checking

## Future Enhancements

- [ ] Add comprehensive test suite
- [ ] Implement route caching
- [ ] Add WebSocket support
- [ ] Create CLI for project scaffolding
- [ ] Add more middleware (CORS, compression, etc.)
- [ ] Implement streaming responses
- [ ] Add benchmarks vs Express/Fastify
- [ ] Create documentation website

## License

MIT

---

**Built with 🔥 by the EmberAPI team**
