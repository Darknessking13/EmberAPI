# 🔥 EmberAPI - Quick Start Guide

## Installation

```bash
# Clone or navigate to the EmberAPI directory
cd EmberAPI

# Install dependencies
pnpm install

# Build all packages
pnpm run build
```

## Running the Example

```bash
# Navigate to the example directory
cd examples/basic

# Run the development server
pnpm run dev
```

The server will start on `http://localhost:3000`

## Try These Endpoints

Open your browser or use curl to test:

```bash
# Home page
curl http://localhost:3000/

# User by ID
curl http://localhost:3000/users/123

# Users with query params
curl http://localhost:3000/users?filter=active&sort=name

# Nested parameters
curl http://localhost:3000/posts/1/comments/5

# HTML page
curl http://localhost:3000/html

# API endpoints
curl http://localhost:3000/api/v1/health
curl http://localhost:3000/api/v1/status

# Wildcard route
curl http://localhost:3000/files/documents/report.pdf

# POST request
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name": "John", "email": "john@example.com"}'
```

## Create Your Own App

### 1. Create a new directory

```bash
mkdir my-ember-app
cd my-ember-app
```

### 2. Initialize package.json

```json
{
  "name": "my-ember-app",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "emberapi": "workspace:*"
  },
  "devDependencies": {
    "tsx": "^4.7.0",
    "typescript": "^5.3.3"
  }
}
```

### 3. Create src/index.ts

```typescript
import { EmberAPI } from 'emberapi';

const app = new EmberAPI();

// Add middleware
app.plug((req, res, next) => {
  console.log(`🔥 ${req.method} ${req.url.pathname}`);
  next();
});

// Define routes
app.get('/', (req, res) => {
  return res.json({ 
    message: 'Welcome to my EmberAPI app! 🔥',
    timestamp: new Date().toISOString()
  });
});

app.get('/hello/:name', (req, res, params) => {
  return res.json({ 
    message: `Hello, ${params.name}!` 
  });
});

app.post('/data', (req, res) => {
  return res.json({ 
    received: req.body,
    message: 'Data received successfully'
  });
});

// API routes with grouping
app.ember('/api', (api) => {
  api.get('/status', (req, res) => {
    return res.json({ status: 'ok', uptime: process.uptime() });
  });
  
  api.get('/info', (req, res) => {
    return res.json({ 
      name: 'My EmberAPI App',
      version: '1.0.0'
    });
  });
});

// Error handler
app.catch((error, req, res) => {
  console.error('Error:', error);
  return res.json({ 
    error: error.message,
    path: req.url.pathname 
  }, 500);
});

// Launch the server
app.launch(3000, () => {
  console.log('🔥 Server is blazing on http://localhost:3000');
});
```

### 4. Run your app

```bash
pnpm install
pnpm run dev
```

## Key Concepts

### 🔥 Fire-Themed Methods

| Method | Purpose | Example |
|--------|---------|---------|
| `launch(port)` | Start server | `app.launch(3000)` |
| `plug(middleware)` | Add middleware | `app.plug((req, res, next) => {...})` |
| `catch(handler)` | Error handling | `app.catch((err, req, res) => {...})` |
| `ember(prefix, callback)` | Route grouping | `app.ember('/api', (api) => {...})` |
| `forge()` | Compile routes | `app.forge()` (auto-called by launch) |

### 📝 Handler Signature

```typescript
(req, res, params, query) => Response | any
```

- `req` - Request context (body, headers, url, method)
- `res` - Response context (json, text, html, send methods)
- `params` - Route parameters (`/users/:id` → `{id: "123"}`)
- `query` - Query parameters (`?filter=active` → `{filter: "active"}`)

### 🎯 Response Methods

```typescript
res.json(data, status?)    // Send JSON
res.text(data, status?)    // Send plain text
res.html(data, status?)    // Send HTML
res.send(data, status?)    // Auto-detect type
```

### 🔌 Middleware

```typescript
app.plug((req, res, next) => {
  // Do something before the route handler
  console.log('Before');
  
  // Call next to continue
  next();
  
  // Do something after (if needed)
  console.log('After');
});
```

## Next Steps

1. Check out the full example in `examples/basic/src/index.ts`
2. Read the API documentation in `README.md`
3. Explore the architecture in `PROJECT_SUMMARY.md`
4. Build something amazing! 🔥

## Need Help?

- Check the examples directory
- Read the source code (it's well-documented!)
- Look at the type definitions for API details

---

**Happy coding with EmberAPI! 🔥**
