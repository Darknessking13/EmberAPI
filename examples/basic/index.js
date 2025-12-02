const { EmberAPI } = require('emberapi');

// Create app instance
const app = new EmberAPI();

// Global middleware - logging
app.plug(async (req, res, next) => {
    const start = Date.now();
    await next();
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.url.pathname} - ${duration}ms`);
});

// Simple routes
app.get('/', (req, res) => {
    return res.json({
        message: '🔥 Welcome to EmberAPI!',
        version: '0.1.0',
        docs: '/api/docs',
    });
});

// Route with parameters
app.get('/users/:id', (req, res, params) => {
    return res.json({
        user: {
            id: params.id,
            name: 'John Doe',
            email: 'john@example.com',
        },
    });
});

// Route with query parameters
app.get('/search', (req, res, params, query) => {
    return res.json({
        query: query.q || '',
        filter: query.filter || 'all',
        results: [],
    });
});

// POST route with body
app.post('/users', async (req, res) => {
    const body = await req.body();

    return res.json({
        message: 'User created',
        data: body,
    }, 201);
});

// Route groups with ember()
app.ember('/api', (router) => {
    router.get('/status', (req, res) => {
        return res.json({ status: 'ok', uptime: process.uptime() });
    });

    router.get('/version', (req, res) => {
        return res.json({ version: '0.1.0', node: process.version });
    });
});

// Nested route group with middleware
app.ember('/api/v1', (router) => {
    // Auth middleware for this group
    const authMiddleware = async (req, res, next) => {
        const token = req.headers.authorization;
        if (!token) {
            return res.json({ error: 'Unauthorized' }, 401);
        }
        await next();
    };

    router.get('/protected', (req, res) => {
        return res.json({ message: 'This is protected!' });
    }, authMiddleware);

    router.get('/posts/:id', (req, res, params) => {
        return res.json({
            post: {
                id: params.id,
                title: 'Sample Post',
                content: 'This is a sample post',
            },
        });
    });
}, async (req, res, next) => {
    // Group-level middleware
    console.log('API v1 request');
    await next();
});

// Wildcard route
app.get('/files/*path', (req, res, params) => {
    return res.json({
        path: params.path,
        message: 'File handler',
    });
});

// Error handling
app.catch((error, res) => {
    console.error('Error:', error);
    return res.json({
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    }, 500);
});

// Launch the server
app.launch(3000, () => {
    console.log('');
    console.log('📚 Available routes:');
    console.log('  GET  /');
    console.log('  GET  /users/:id');
    console.log('  GET  /search?q=term&filter=active');
    console.log('  POST /users');
    console.log('  GET  /api/status');
    console.log('  GET  /api/version');
    console.log('  GET  /api/v1/protected (requires auth)');
    console.log('  GET  /api/v1/posts/:id');
    console.log('  GET  /files/*path');
    console.log('');
});
