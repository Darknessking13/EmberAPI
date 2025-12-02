/**
 * HTTP Benchmark - Real-world HTTP performance test
 * Uses autocannon to benchmark actual HTTP servers
 * Tests: EmberAPI vs Fastify vs Express
 */

const autocannon = require('autocannon');
const { EmberAPI } = require('emberapi');
const fastify = require('fastify');
const express = require('express');

const PORT_EMBER = 3001;
const PORT_FASTIFY = 3002;
const PORT_EXPRESS = 3003;

// Benchmark configuration
const BENCHMARK_CONFIG = {
    duration: 10, // seconds
    connections: 100,
    pipelining: 10,
};

// Setup EmberAPI server
function setupEmberAPI() {
    const app = new EmberAPI();

    app.get('/', (req, res) => {
        return res.json({ message: 'Hello World', framework: 'EmberAPI' });
    });

    app.get('/users/:id', (req, res, params) => {
        return res.json({ id: params.id, name: 'John Doe', framework: 'EmberAPI' });
    });

    app.post('/users', async (req, res) => {
        const body = await req.body();
        return res.json({ created: true, data: body, framework: 'EmberAPI' }, 201);
    });

    app.get('/api/v1/products/:id', (req, res, params, query) => {
        return res.json({
            id: params.id,
            price: 99.99,
            filter: query.filter,
            framework: 'EmberAPI'
        });
    });

    return app;
}

// Setup Fastify server
function setupFastify() {
    const app = fastify({ logger: false });

    app.get('/', async (request, reply) => {
        return { message: 'Hello World', framework: 'Fastify' };
    });

    app.get('/users/:id', async (request, reply) => {
        return { id: request.params.id, name: 'John Doe', framework: 'Fastify' };
    });

    app.post('/users', async (request, reply) => {
        reply.code(201);
        return { created: true, data: request.body, framework: 'Fastify' };
    });

    app.get('/api/v1/products/:id', async (request, reply) => {
        return {
            id: request.params.id,
            price: 99.99,
            filter: request.query.filter,
            framework: 'Fastify'
        };
    });

    return app;
}

// Setup Express server
function setupExpress() {
    const app = express();
    app.use(express.json());

    app.get('/', (req, res) => {
        res.json({ message: 'Hello World', framework: 'Express' });
    });

    app.get('/users/:id', (req, res) => {
        res.json({ id: req.params.id, name: 'John Doe', framework: 'Express' });
    });

    app.post('/users', (req, res) => {
        res.status(201).json({ created: true, data: req.body, framework: 'Express' });
    });

    app.get('/api/v1/products/:id', (req, res) => {
        res.json({
            id: req.params.id,
            price: 99.99,
            filter: req.query.filter,
            framework: 'Express'
        });
    });

    return app;
}

// Run autocannon benchmark
function runBenchmark(url, title) {
    return new Promise((resolve) => {
        console.log(`\n🔥 Running: ${title}`);
        console.log('-'.repeat(80));

        const instance = autocannon({
            url,
            ...BENCHMARK_CONFIG,
        }, (err, result) => {
            if (err) {
                console.error('Error:', err);
                resolve(null);
                return;
            }

            console.log(`Requests/sec: ${result.requests.average.toFixed(2)}`);
            console.log(`Latency (ms): ${result.latency.mean.toFixed(2)}`);
            console.log(`Throughput (MB/sec): ${(result.throughput.average / 1024 / 1024).toFixed(2)}`);
            console.log(`Total requests: ${result.requests.total}`);

            resolve({
                title,
                requestsPerSec: result.requests.average,
                latency: result.latency.mean,
                throughput: result.throughput.average,
                totalRequests: result.requests.total,
            });
        });

        autocannon.track(instance);
    });
}

// Main benchmark function
async function runAllBenchmarks() {
    console.log('🔥 EmberAPI HTTP Benchmark (using autocannon)\n');
    console.log('Configuration:');
    console.log(`  Duration: ${BENCHMARK_CONFIG.duration} seconds`);
    console.log(`  Connections: ${BENCHMARK_CONFIG.connections}`);
    console.log(`  Pipelining: ${BENCHMARK_CONFIG.pipelining}`);
    console.log('\n' + '='.repeat(80));

    // Start servers
    console.log('\n📡 Starting servers...\n');

    const emberApp = setupEmberAPI();
    const emberServer = emberApp.launch(PORT_EMBER, () => {
        console.log(`✅ EmberAPI server running on port ${PORT_EMBER}`);
    });

    const fastifyApp = setupFastify();
    await fastifyApp.listen({ port: PORT_FASTIFY });
    console.log(`✅ Fastify server running on port ${PORT_FASTIFY}`);

    const expressApp = setupExpress();
    const expressServer = expressApp.listen(PORT_EXPRESS, () => {
        console.log(`✅ Express server running on port ${PORT_EXPRESS}`);
    });

    // Wait for servers to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('\n' + '='.repeat(80));

    // Benchmark 1: Static route
    console.log('\n📊 Benchmark 1: Static Route (GET /)');
    console.log('='.repeat(80));

    const ember1 = await runBenchmark(`http://localhost:${PORT_EMBER}/`, 'EmberAPI - GET /');
    const fastify1 = await runBenchmark(`http://localhost:${PORT_FASTIFY}/`, 'Fastify - GET /');
    const express1 = await runBenchmark(`http://localhost:${PORT_EXPRESS}/`, 'Express - GET /');

    // Benchmark 2: Parametric route
    console.log('\n📊 Benchmark 2: Parametric Route (GET /users/:id)');
    console.log('='.repeat(80));

    const ember2 = await runBenchmark(`http://localhost:${PORT_EMBER}/users/123`, 'EmberAPI - GET /users/:id');
    const fastify2 = await runBenchmark(`http://localhost:${PORT_FASTIFY}/users/123`, 'Fastify - GET /users/:id');
    const express2 = await runBenchmark(`http://localhost:${PORT_EXPRESS}/users/123`, 'Express - GET /users/:id');

    // Benchmark 3: Nested parametric route with query
    console.log('\n📊 Benchmark 3: Nested Route with Query (GET /api/v1/products/:id?filter=active)');
    console.log('='.repeat(80));

    const ember3 = await runBenchmark(`http://localhost:${PORT_EMBER}/api/v1/products/abc123?filter=active`, 'EmberAPI - GET /api/v1/products/:id');
    const fastify3 = await runBenchmark(`http://localhost:${PORT_FASTIFY}/api/v1/products/abc123?filter=active`, 'Fastify - GET /api/v1/products/:id');
    const express3 = await runBenchmark(`http://localhost:${PORT_EXPRESS}/api/v1/products/abc123?filter=active`, 'Express - GET /api/v1/products/:id');

    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('📈 SUMMARY');
    console.log('='.repeat(80));

    const results = [
        { name: 'Static Route', ember: ember1, fastify: fastify1, express: express1 },
        { name: 'Parametric Route', ember: ember2, fastify: fastify2, express: express2 },
        { name: 'Nested Route + Query', ember: ember3, fastify: fastify3, express: express3 },
    ];

    console.log('\n📊 Average Requests/sec:');
    console.log('-'.repeat(80));

    for (const result of results) {
        console.log(`\n${result.name}:`);
        console.log(`  EmberAPI: ${result.ember.requestsPerSec.toFixed(2).padStart(12)} req/sec`);
        console.log(`  Fastify:  ${result.fastify.requestsPerSec.toFixed(2).padStart(12)} req/sec`);
        console.log(`  Express:  ${result.express.requestsPerSec.toFixed(2).padStart(12)} req/sec`);

        const max = Math.max(result.ember.requestsPerSec, result.fastify.requestsPerSec, result.express.requestsPerSec);
        const winner = max === result.ember.requestsPerSec ? '🔥 EmberAPI' :
            max === result.fastify.requestsPerSec ? 'Fastify' : 'Express';
        console.log(`  Winner: ${winner}`);
    }

    // Overall averages
    const avgEmber = (ember1.requestsPerSec + ember2.requestsPerSec + ember3.requestsPerSec) / 3;
    const avgFastify = (fastify1.requestsPerSec + fastify2.requestsPerSec + fastify3.requestsPerSec) / 3;
    const avgExpress = (express1.requestsPerSec + express2.requestsPerSec + express3.requestsPerSec) / 3;

    console.log('\n📊 Overall Average:');
    console.log('-'.repeat(80));
    console.log(`  EmberAPI: ${avgEmber.toFixed(2).padStart(12)} req/sec`);
    console.log(`  Fastify:  ${avgFastify.toFixed(2).padStart(12)} req/sec`);
    console.log(`  Express:  ${avgExpress.toFixed(2).padStart(12)} req/sec`);

    const overallMax = Math.max(avgEmber, avgFastify, avgExpress);
    const overallWinner = overallMax === avgEmber ? '🔥 EmberAPI' :
        overallMax === avgFastify ? 'Fastify' : 'Express';

    console.log(`\n🏆 Overall Winner: ${overallWinner}`);
    console.log('='.repeat(80));

    // Cleanup
    console.log('\n🧹 Shutting down servers...');
    emberServer.close();
    await fastifyApp.close();
    expressServer.close();

    console.log('✅ Done!\n');
}

// Run benchmarks
runAllBenchmarks().catch(console.error);
