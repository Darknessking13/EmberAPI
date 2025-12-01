# 🔥 EmberAPI

A blazing fast Node.js framework with fire-themed APIs and high-performance routing.

## Features

- ⚡ **Blazing Fast**: Pre-compiled routes with radix tree for O(log n) matching
- 🔥 **Fire-Themed API**: Intuitive methods like `launch()`, `plug()`, `catch()`, and `ember()`
- 🎯 **Zero Dependencies**: Built on native Web APIs (Request/Response)
- 📦 **Monorepo**: Modular architecture with separate `@emberapi/router` package
- 🚀 **TypeScript**: Full type safety out of the box
- 🔧 **Turborepo**: Fast builds and caching

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

## Installation

```bash
npm install emberapi
```

## Quick Start

```typescript
import { EmberAPI } from 'emberapi';

const app = new EmberAPI();

// Define routes
app.get('/', (req, res) => {
  return res.json({ message: 'Hello from EmberAPI! 🔥' });
});

app.get('/users/:id', (req, res, params) => {
  return res.json({ userId: params.id });
});

// Launch the server
app.launch(3000);
```

## API Reference

### Application Lifecycle

| Method | Description |
|--------|-------------|
| `launch(port, callback?)` | Start the server and compile routes |
| `forge()` | Manually compile routes (called automatically by `launch()`) |
| `close()` | Close the server |

### Middleware

| Method | Description |
|--------|-------------|
| `plug(middleware)` | Add global middleware to the pipeline |

### Route Grouping

| Method | Description |
|--------|-------------|
| `ember(prefix, callback, ...middleware)` | Group routes with common prefix and middleware |

### Error Handling

| Method | Description |
|--------|-------------|
| `catch(handler)` | Register global error handler |

### HTTP Methods

- `get(pattern, handler, ...middleware)`
- `post(pattern, handler, ...middleware)`
- `put(pattern, handler, ...middleware)`
- `delete(pattern, handler, ...middleware)`
- `patch(pattern, handler, ...middleware)`
- `options(pattern, handler, ...middleware)`
- `head(pattern, handler, ...middleware)`

## Request Context

| Property | Description |
|----------|-------------|
| `req.raw` | Original Request object |
| `req.body` | Parsed request body (JSON/form/text) |
| `req.headers` | Request headers |
| `req.url` | Parsed URL object |
| `req.method` | HTTP method |

## Response Context

| Method | Description |
|--------|-------------|
| `res.json(data, status?)` | Send JSON response |
| `res.text(data, status?)` | Send text response |
| `res.html(data, status?)` | Send HTML response |
| `res.send(data, status?)` | Auto-detect and send response |

## Handler Signature

```typescript
handler(req, res, params, query) => Response | any
```

- `req` - Request context
- `res` - Response context
- `params` - Route parameters (e.g., `/users/:id` → `{id: "123"}`)
- `query` - Query string parameters (e.g., `?filter=active` → `{filter: "active"}`)

## Examples

### Middleware

```typescript
app.plug((req, res, next) => {
  console.log(`${req.method} ${req.url.pathname}`);
  next();
});
```

### Route Groups

```typescript
app.ember('/api', (api) => {
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

## Performance Tips

1. **Always call `forge()` manually** if you're adding routes dynamically
2. **Use `plug()` sparingly** - each middleware adds overhead
3. **Group related routes** with `ember()` for better organization
4. **Keep handlers simple** - offload heavy work to background jobs
5. **Use native `Response`** objects when possible for zero overhead

## Monorepo Structure

```
EmberAPI/
├── packages/
│   ├── router/          # @emberapi/router - Fast routing engine
│   └── emberapi/        # emberapi - Main framework
├── package.json
├── turbo.json
└── tsconfig.json
```

## Development

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Watch mode
npm run dev

# Run tests
npm run test
```

## License

MIT
