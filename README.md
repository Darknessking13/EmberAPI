# 🔥 EmberAPI

A blazing fast web framework for Node.js with pre-compiled routes and radix tree routing.

## Features

- ⚡ **Blazing Fast** - Pre-compiled routes with O(log n) radix tree matching
- 🎯 **Zero Dependencies** - Core framework uses only `fast-deep-equal` and `fast-querystring`
- 🔥 **Fire-Themed API** - `launch()`, `plug()`, `ember()`, `catch()`, `forge()`
- 🌲 **Radix Tree Router** - Optimized route matching with minimal overhead
- 🔌 **Middleware Pipeline** - Pre-composed middleware chain for performance
- 📦 **Monorepo** - Organized with pnpm workspaces and Turbo
- 🎨 **Separated Contexts** - Clean `req`, `res`, `params`, `query` separation

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         EmberAPI Architecture                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌────────────┐        ┌──────────────────────────────────┐         │
│  │  Request   │ ──────▶│      Route Compiler              │         │
│  │            │        │  • Pre-compile route patterns    │         │
│  └────────────┘        │  • Generate match functions      │         │
│                        │  • Cache param extractors        │         │
│                        └──────────────┬───────────────────┘         │
│                                       │                             │
│                                       ▼                             │
│                        ┌──────────────────────────────────┐         │
│                        │      Fast Router (RadixTree)     │         │
│                        │  • O(log n) route matching       │         │
│                        │  • Compiled param extraction     │         │
│                        └──────────────┬───────────────────┘         │
│                                       │                             │
│                        ┌──────────────▼───────────────────┐         │
│                        │    Middleware Pipeline           │         │
│                        │  • Pre-composed chain            │         │
│                        │  • Minimal function calls        │         │
│                        └──────────────┬───────────────────┘         │
│                                       │                             │
│         ┌─────────────────────────────┼─────────────────────────┐   │
│         │                             │                         │   │
│         ▼                             ▼                         ▼   │
│  ┌────────────┐              ┌────────────┐            ┌──────────┐ │
│  │    req     │              │    res     │            │  params  │ │
│  │  Context   │              │  Context   │            │  query   │ │
│  │            │              │            │            │          │ │
│  │ • body     │              │ • status   │            │ Separate │ │
│  │ • headers  │              │ • headers  │            │ Objects  │ │
│  │ • url      │              │ • json()   │            │          │ │
│  │ • method   │              │ • text()   │            │          │ │
│  └────────────┘              │ • html()   │            └──────────┘ │
│                              └────────────┘                         │
└─────────────────────────────────────────────────────────────────────┘
```

## Quick Start

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run example
cd examples/basic
node index.js
```

## Usage

```javascript
const { EmberAPI } = require('emberapi');

const app = new EmberAPI();

// Simple route
app.get('/', (req, res) => {
  return res.json({ message: '🔥 Welcome to EmberAPI!' });
});

// Route with parameters
app.get('/users/:id', (req, res, params) => {
  return res.json({ userId: params.id });
});

// Route with query parameters
app.get('/search', (req, res, params, query) => {
  return res.json({ query: query.q });
});

// Global middleware
app.plug(async (req, res, next) => {
  console.log(`${req.method} ${req.url.pathname}`);
  await next();
});

// Route groups
app.ember('/api', (router) => {
  router.get('/status', (req, res) => {
    return res.json({ status: 'ok' });
  });
});

// Error handling
app.catch((error, res) => {
  return res.json({ error: error.message }, 500);
});

// Launch server
app.launch(3000);
```

## API Reference

### Application Lifecycle

| Method | Description |
|--------|-------------|
| `launch(port, callback?)` | Start the server and compile routes |
| `forge()` | Manually compile routes (called automatically) |
| `close(callback?)` | Stop the server |

### Middleware

| Method | Description |
|--------|-------------|
| `plug(middleware)` | Add global middleware to the pipeline |

### Route Grouping

| Method | Description |
|--------|-------------|
| `ember(prefix, callback, ...mw)` | Group routes with common prefix and middleware |

### Error Handling

| Method | Description |
|--------|-------------|
| `catch(handler)` | Register global error handler |

### HTTP Methods

| Method | Description |
|--------|-------------|
| `get(path, handler, ...mw)` | Register GET route |
| `post(path, handler, ...mw)` | Register POST route |
| `put(path, handler, ...mw)` | Register PUT route |
| `delete(path, handler, ...mw)` | Register DELETE route |
| `patch(path, handler, ...mw)` | Register PATCH route |
| `options(path, handler, ...mw)` | Register OPTIONS route |
| `head(path, handler, ...mw)` | Register HEAD route |

### Request Context

| Property/Method | Description |
|-----------------|-------------|
| `req.raw` | Original Request object |
| `req.body()` | Parsed request body (async) |
| `req.headers` | Request headers |
| `req.url` | Parsed URL object |
| `req.method` | HTTP method |

### Response Context

| Method | Description |
|--------|-------------|
| `res.json(data, status?)` | Send JSON response |
| `res.text(data, status?)` | Send text response |
| `res.html(data, status?)` | Send HTML response |
| `res.send(data, status?)` | Auto-detect and send response |
| `res.setHeader(name, value)` | Set response header |

### Handler Signature

```javascript
handler(req, res, params, query) => Response | any
```

- `req` - Request context
- `res` - Response context
- `params` - Route parameters (e.g., `/users/:id` → `{id: "123"}`)
- `query` - Query string parameters (e.g., `?filter=active` → `{filter: "active"}`)

### Middleware Signature

```javascript
middleware(req, res, next) => void | Promise<void>
```

## Packages

- **`emberapi`** - Main framework package
- **`@emberapi/router`** - Standalone router with radix tree

## Performance Tips

1. **Always call `forge()` manually** if you're adding routes dynamically
2. **Use `plug()` sparingly** - each middleware adds overhead
3. **Group related routes** with `ember()` for better organization
4. **Keep handlers simple** - offload heavy work to background jobs
5. **Use native `Response`** objects when possible for zero overhead

## Development

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Watch mode
pnpm dev

# Run tests
pnpm test

# Clean build artifacts
pnpm clean
```

## License

MIT
