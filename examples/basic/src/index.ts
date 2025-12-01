/**
 * 🔥 EmberAPI Example Application
 * Demonstrates the fire-themed API and high-performance routing
 */

import { EmberAPI } from 'emberapi';

const app = new EmberAPI();

// 🔥 Global middleware using plug()
app.plug((req, res, next) => {
    console.log(`🔥 ${req.method} ${req.url.pathname}`);
    next();
});

// 🔥 Error handler using catch()
app.catch((error, req, res) => {
    console.error('❌ Error:', error);
    return res.json({
        error: error.message,
        path: req.url.pathname
    }, 500);
});

// 🔥 Basic routes
app.get('/', (req, res) => {
    return res.json({
        message: 'Welcome to EmberAPI! 🔥',
        endpoints: [
            'GET /',
            'GET /users',
            'GET /users/:id',
            'POST /users',
            'GET /posts/:id/comments/:commentId',
            'GET /api/v1/health',
            'GET /api/v1/status'
        ]
    });
});

// 🔥 Route with parameters
app.get('/users/:id', (req, res, params) => {
    return res.json({
        userId: params.id,
        message: `Fetching user ${params.id}`
    });
});

// 🔥 Route with query parameters
app.get('/users', (req, res, params, query) => {
    return res.json({
        users: [],
        filters: query,
        message: 'Listing all users'
    });
});

// 🔥 POST route with body
app.post('/users', async (req, res) => {
    return res.json({
        message: 'User created',
        data: req.body
    }, 201);
});

// 🔥 Multiple parameters
app.get('/posts/:id/comments/:commentId', (req, res, params) => {
    return res.json({
        postId: params.id,
        commentId: params.commentId,
        message: `Fetching comment ${params.commentId} from post ${params.id}`
    });
});

// 🔥 HTML response
app.get('/html', (req, res) => {
    return res.html(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>EmberAPI 🔥</title>
        <style>
          body {
            font-family: system-ui;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
          }
          h1 { font-size: 3em; }
          .emoji { font-size: 2em; }
        </style>
      </head>
      <body>
        <h1>EmberAPI <span class="emoji">🔥</span></h1>
        <p>A blazing fast Node.js framework with fire-themed APIs!</p>
        <ul>
          <li>⚡ Pre-compiled routes</li>
          <li>🎯 Radix tree routing</li>
          <li>🔥 Fire-themed API</li>
          <li>📦 Monorepo architecture</li>
        </ul>
      </body>
    </html>
  `);
});

// 🔥 Route grouping with ember()
app.ember('/api/v1', (api) => {
    // Middleware specific to this group
    api.plug((req, res, next) => {
        res.headers.set('X-API-Version', '1.0');
        next();
    });

    api.get('/health', (req, res) => {
        return res.json({ status: 'healthy', timestamp: Date.now() });
    });

    api.get('/status', (req, res) => {
        return res.json({
            status: 'running',
            uptime: process.uptime(),
            memory: process.memoryUsage()
        });
    });
});

// 🔥 Nested route groups
app.ember('/api/v2', (api) => {
    api.ember('/users', (users) => {
        users.get('/', (req, res) => {
            return res.json({ version: 2, users: [] });
        });

        users.get('/:id', (req, res, params) => {
            return res.json({ version: 2, userId: params.id });
        });
    });
});

// 🔥 Wildcard route
app.get('/files/*', (req, res, params) => {
    return res.json({
        path: params['*'],
        message: `Accessing file: ${params['*']}`
    });
});

// 🔥 Launch the server!
app.launch(3000, () => {
    console.log('');
    console.log('🔥🔥🔥 EmberAPI is blazing! 🔥🔥🔥');
    console.log('');
    console.log('Try these endpoints:');
    console.log('  → http://localhost:3000/');
    console.log('  → http://localhost:3000/users/123');
    console.log('  → http://localhost:3000/users?filter=active&sort=name');
    console.log('  → http://localhost:3000/posts/1/comments/5');
    console.log('  → http://localhost:3000/html');
    console.log('  → http://localhost:3000/api/v1/health');
    console.log('  → http://localhost:3000/files/documents/report.pdf');
    console.log('');
});
