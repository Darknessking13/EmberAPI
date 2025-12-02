/**
 * Framework Benchmark - Compare full framework performance
 * Tests: EmberAPI vs Fastify vs Express
 * 
 * This benchmark tests the overhead of the framework layer on top of routing
 */

const { EmberAPI } = require('emberapi');
const fastify = require('fastify');
const express = require('express');

// Benchmark configuration
const ITERATIONS = 100000;
const WARMUP_ITERATIONS = 1000;

// Mock request/response objects
class MockRequest {
    constructor(method, url, headers = {}, body = null) {
        this.method = method;
        this.url = url;
        this.headers = headers;
        this.body = body;
    }
}

class MockResponse {
    constructor() {
        this.statusCode = 200;
        this.headers = {};
        this._body = null;
    }

    writeHead(status, headers) {
        this.statusCode = status;
        if (headers) Object.assign(this.headers, headers);
    }

    setHeader(name, value) {
        this.headers[name] = value;
    }

    end(body) {
        this._body = body;
    }
}

// Setup EmberAPI
function setupEmberAPI() {
    const app = new EmberAPI();

    app.get('/', (req, res) => {
        return res.json({ message: 'Hello World' });
    });

    app.get('/users/:id', (req, res, params) => {
        return res.json({ id: params.id, name: 'John Doe' });
    });

    app.post('/users', async (req, res) => {
        return res.json({ created: true }, 201);
    });

    app.get('/api/v1/products/:id', (req, res, params) => {
        return res.json({ id: params.id, price: 99.99 });
    });

    app.forge();
    return app;
}

// Setup Fastify
function setupFastify() {
    const app = fastify();

    app.get('/', async (request, reply) => {
        return { message: 'Hello World' };
    });

    app.get('/users/:id', async (request, reply) => {
        return { id: request.params.id, name: 'John Doe' };
    });

    app.post('/users', async (request, reply) => {
        reply.code(201);
        return { created: true };
    });

    app.get('/api/v1/products/:id', async (request, reply) => {
        return { id: request.params.id, price: 99.99 };
    });

    return app;
}

// Setup Express
function setupExpress() {
    const app = express();

    app.get('/', (req, res) => {
        res.json({ message: 'Hello World' });
    });

    app.get('/users/:id', (req, res) => {
        res.json({ id: req.params.id, name: 'John Doe' });
    });

    app.post('/users', (req, res) => {
        res.status(201).json({ created: true });
    });

    app.get('/api/v1/products/:id', (req, res) => {
        res.json({ id: req.params.id, price: 99.99 });
    });

    return app;
}

// Benchmark function
function benchmark(name, fn, iterations) {
    // Warmup
    for (let i = 0; i < WARMUP_ITERATIONS; i++) {
        fn();
    }

    // Force garbage collection if available
    if (global.gc) {
        global.gc();
    }

    // Actual benchmark
    const start = process.hrtime.bigint();

    for (let i = 0; i < iterations; i++) {
        fn();
    }

    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1000000; // Convert to milliseconds
    const opsPerSec = (iterations / duration) * 1000;

    return {
        name,
        duration: duration.toFixed(2),
        iterations,
        opsPerSec: opsPerSec.toFixed(0),
    };
}

// Benchmark EmberAPI route matching
async function benchmarkEmberAPI(app, method, url) {
    return benchmark(
        'EmberAPI',
        async () => {
            const req = new MockRequest(method, url, { host: 'localhost' });
            const res = new MockResponse();
            await app.handleRequest(req, res);
        },
        ITERATIONS
    );
}

// Benchmark Express route matching
function benchmarkExpress(app, method, url) {
    return benchmark(
        'Express',
        () => {
            const req = new MockRequest(method, url);
            const res = new MockResponse();
            res.json = (data) => {
                res._body = JSON.stringify(data);
            };
            res.status = (code) => {
                res.statusCode = code;
                return res;
            };

            // Manually trigger Express routing
            const route = app._router.stack.find(layer => {
                if (!layer.route) return false;
                if (layer.route.path === url.split('?')[0]) {
                    return layer.route.methods[method.toLowerCase()];
                }
                // Handle parametric routes
                if (layer.route.path.includes(':')) {
                    const regex = layer.regexp;
                    return regex.test(url.split('?')[0]) && layer.route.methods[method.toLowerCase()];
                }
                return false;
            });

            if (route) {
                req.params = {};
                route.route.stack[0].handle(req, res);
            }
        },
        ITERATIONS
    );
}

// Run benchmarks
console.log('🔥 EmberAPI Framework Benchmark\n');
console.log('Setting up frameworks...\n');

const emberApp = setupEmberAPI();
const fastifyApp = setupFastify();
const expressApp = setupExpress();

console.log('Iterations per test:', ITERATIONS.toLocaleString());
console.log('Warmup iterations:', WARMUP_ITERATIONS.toLocaleString());
console.log('\n' + '='.repeat(80) + '\n');

// Benchmark 1: Static route
console.log('📊 Benchmark 1: Static Route (GET /)');
console.log('-'.repeat(80));

const ember1 = await benchmarkEmberAPI(emberApp, 'GET', '/');
const express1 = benchmarkExpress(expressApp, 'GET', '/');

console.log(`${ember1.name.padEnd(20)} ${ember1.opsPerSec.padStart(15)} ops/sec (${ember1.duration}ms)`);
console.log(`${express1.name.padEnd(20)} ${express1.opsPerSec.padStart(15)} ops/sec (${express1.duration}ms)`);
console.log(`Winner: ${Number(ember1.opsPerSec) > Number(express1.opsPerSec) ? '🔥 EmberAPI' : 'Express'} (${(Math.max(Number(ember1.opsPerSec), Number(express1.opsPerSec)) / Math.min(Number(ember1.opsPerSec), Number(express1.opsPerSec))).toFixed(2)}x faster)`);
console.log('\n');

// Benchmark 2: Parametric route
console.log('📊 Benchmark 2: Parametric Route (GET /users/:id)');
console.log('-'.repeat(80));

const ember2 = await benchmarkEmberAPI(emberApp, 'GET', '/users/123');
const express2 = benchmarkExpress(expressApp, 'GET', '/users/123');

console.log(`${ember2.name.padEnd(20)} ${ember2.opsPerSec.padStart(15)} ops/sec (${ember2.duration}ms)`);
console.log(`${express2.name.padEnd(20)} ${express2.opsPerSec.padStart(15)} ops/sec (${express2.duration}ms)`);
console.log(`Winner: ${Number(ember2.opsPerSec) > Number(express2.opsPerSec) ? '🔥 EmberAPI' : 'Express'} (${(Math.max(Number(ember2.opsPerSec), Number(express2.opsPerSec)) / Math.min(Number(ember2.opsPerSec), Number(express2.opsPerSec))).toFixed(2)}x faster)`);
console.log('\n');

// Benchmark 3: POST route
console.log('📊 Benchmark 3: POST Route (POST /users)');
console.log('-'.repeat(80));

const ember3 = await benchmarkEmberAPI(emberApp, 'POST', '/users');
const express3 = benchmarkExpress(expressApp, 'POST', '/users');

console.log(`${ember3.name.padEnd(20)} ${ember3.opsPerSec.padStart(15)} ops/sec (${ember3.duration}ms)`);
console.log(`${express3.name.padEnd(20)} ${express3.opsPerSec.padStart(15)} ops/sec (${express3.duration}ms)`);
console.log(`Winner: ${Number(ember3.opsPerSec) > Number(express3.opsPerSec) ? '🔥 EmberAPI' : 'Express'} (${(Math.max(Number(ember3.opsPerSec), Number(express3.opsPerSec)) / Math.min(Number(ember3.opsPerSec), Number(express3.opsPerSec))).toFixed(2)}x faster)`);
console.log('\n');

// Benchmark 4: Nested route
console.log('📊 Benchmark 4: Nested Route (GET /api/v1/products/:id)');
console.log('-'.repeat(80));

const ember4 = await benchmarkEmberAPI(emberApp, 'GET', '/api/v1/products/abc123');
const express4 = benchmarkExpress(expressApp, 'GET', '/api/v1/products/abc123');

console.log(`${ember4.name.padEnd(20)} ${ember4.opsPerSec.padStart(15)} ops/sec (${ember4.duration}ms)`);
console.log(`${express4.name.padEnd(20)} ${express4.opsPerSec.padStart(15)} ops/sec (${express4.duration}ms)`);
console.log(`Winner: ${Number(ember4.opsPerSec) > Number(express4.opsPerSec) ? '🔥 EmberAPI' : 'Express'} (${(Math.max(Number(ember4.opsPerSec), Number(express4.opsPerSec)) / Math.min(Number(ember4.opsPerSec), Number(express4.opsPerSec))).toFixed(2)}x faster)`);
console.log('\n');

// Summary
console.log('='.repeat(80));
console.log('📈 SUMMARY\n');

const results = [
    { ember: ember1, express: express1 },
    { ember: ember2, express: express2 },
    { ember: ember3, express: express3 },
    { ember: ember4, express: express4 },
];

const emberWins = results.filter(r => Number(r.ember.opsPerSec) > Number(r.express.opsPerSec)).length;

const avgEmberOps = (results.reduce((sum, r) => sum + Number(r.ember.opsPerSec), 0) / results.length).toFixed(0);
const avgExpressOps = (results.reduce((sum, r) => sum + Number(r.express.opsPerSec), 0) / results.length).toFixed(0);

console.log(`EmberAPI wins: ${emberWins}/${results.length} benchmarks`);
console.log(`Express wins: ${results.length - emberWins}/${results.length} benchmarks`);
console.log('');
console.log(`Average EmberAPI: ${avgEmberOps} ops/sec`);
console.log(`Average Express: ${avgExpressOps} ops/sec`);
console.log('');
console.log(`Overall winner: ${Number(avgEmberOps) > Number(avgExpressOps) ? '🔥 EmberAPI' : 'Express'}`);
console.log(`Performance difference: ${(Math.max(Number(avgEmberOps), Number(avgExpressOps)) / Math.min(Number(avgEmberOps), Number(avgExpressOps))).toFixed(2)}x`);
console.log('='.repeat(80));

console.log('\n💡 Note: These are synthetic benchmarks. For real-world HTTP performance,');
console.log('   run the HTTP benchmark with autocannon: npm run bench:autocannon');
