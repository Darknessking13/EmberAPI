# 🔥 EmberAPI Framework

Welcome to **EmberAPI** - a blazing fast, modern web framework for Node.js built with performance in mind!

## ✨ What You've Got

This is a complete **monorepo** setup with:

### 📦 Packages

1. **`@emberapi/router`** - Standalone high-performance router
   - Radix tree for O(log n) route matching
   - Pre-compiled route patterns
   - Uses `fast-deep-equal` and `fast-querystring`
   - Can be used independently in other projects!

2. **`emberapi`** - Main framework package
   - Built on top of `@emberapi/router`
   - Fire-themed API (`launch`, `plug`, `ember`, `catch`, `forge`)
   - Request/Response contexts
   - Middleware pipeline
   - Error handling

### 🎯 Examples

- **`examples/basic`** - Complete example application showing all features

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run the example
cd examples/basic
node index.js

# In another terminal, test it
node test.js
```

## 📖 API Overview

### Creating an App

```javascript
const { EmberAPI } = require('emberapi');
const app = new EmberAPI();
```

### Routes

```javascript
// Simple route
app.get('/', (req, res) => {
  return res.json({ message: 'Hello!' });
});

// Route with params
app.get('/users/:id', (req, res, params) => {
  return res.json({ userId: params.id });
});

// Route with query
app.get('/search', (req, res, params, query) => {
  return res.json({ q: query.q });
});

// POST with body
app.post('/users', async (req, res) => {
  const body = await req.body();
  return res.json({ created: body }, 201);
});
```

### Middleware

```javascript
// Global middleware
app.plug(async (req, res, next) => {
  console.log(`${req.method} ${req.url.pathname}`);
  await next();
});

// Route-specific middleware
const auth = async (req, res, next) => {
  if (!req.headers.authorization) {
    return res.json({ error: 'Unauthorized' }, 401);
  }
  await next();
};

app.get('/protected', (req, res) => {
  return res.json({ secret: 'data' });
}, auth);
```

### Route Groups

```javascript
// Group routes with common prefix
app.ember('/api', (router) => {
  router.get('/status', (req, res) => {
    return res.json({ status: 'ok' });
  });
  
  router.get('/version', (req, res) => {
    return res.json({ version: '1.0.0' });
  });
});

// Group with middleware
app.ember('/admin', (router) => {
  router.get('/dashboard', (req, res) => {
    return res.json({ dashboard: 'data' });
  });
}, authMiddleware);
```

### Error Handling

```javascript
app.catch((error, res) => {
  console.error(error);
  return res.json({ error: error.message }, 500);
});
```

### Launch Server

```javascript
app.launch(3000, () => {
  console.log('Server running on port 3000');
});
```

## 🏗️ Project Structure

```
EmberAPI/
├── packages/
│   ├── router/              # @emberapi/router package
│   │   ├── src/
│   │   │   ├── radix-tree.js    # Radix tree implementation
│   │   │   ├── compiler.js      # Route compiler
│   │   │   ├── router.js        # Main router class
│   │   │   └── index.js         # Exports
│   │   ├── package.json
│   │   └── build.js
│   │
│   └── emberapi/            # Main framework package
│       ├── src/
│       │   ├── emberapi.js      # Main EmberAPI class
│       │   ├── context.js       # Request/Response contexts
│       │   └── index.js         # Exports
│       ├── package.json
│       └── build.js
│
├── examples/
│   └── basic/               # Example application
│       ├── index.js         # Main app
│       ├── test.js          # Test script
│       └── package.json
│
├── package.json             # Root package.json
├── pnpm-workspace.yaml      # PNPM workspace config
├── turbo.json               # Turbo build config
└── README.md                # This file
```

## 🛠️ Development

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Build in watch mode
pnpm dev

# Clean build artifacts
pnpm clean
```

## 🎨 Fire-Themed API

EmberAPI uses fire-themed method names for a unique developer experience:

- **`launch(port)`** - Start the server (more powerful than "listen")
- **`plug(middleware)`** - Add middleware (connecting components)
- **`ember(prefix, callback, ...mw)`** - Create route groups (embers of the fire)
- **`catch(handler)`** - Error handling (catching falling sparks)
- **`forge()`** - Manually compile routes (forging the routes)

Standard HTTP methods remain unchanged: `get()`, `post()`, `put()`, `delete()`, `patch()`, `options()`, `head()`

## 🚄 Performance Features

1. **Pre-compiled Routes** - Routes are compiled at startup, not on every request
2. **Radix Tree** - O(log n) route matching instead of linear search
3. **Separated Contexts** - Minimal memory allocations with separate req/res/params/query
4. **Middleware Pre-composition** - Middleware chain is optimized during compilation
5. **Native Web APIs** - Uses standard Request/Response objects where possible

## 📦 Using the Router Standalone

The `@emberapi/router` package can be used independently:

```javascript
const { Router } = require('@emberapi/router');

const router = new Router();

router.get('/users/:id', (req, res, params, query) => {
  console.log('User ID:', params.id);
});

// Compile routes
router.forge();

// Find a route
const match = router.find('GET', '/users/123?filter=active');
// { handler, params: { id: '123' }, query: { filter: 'active' }, middleware: [] }
```

## 🤝 Contributing

This is your framework! Feel free to:
- Add new features
- Improve performance
- Fix bugs
- Add tests
- Improve documentation

## 📄 License

MIT

---

**Built with 🔥 by the EmberAPI Team**
