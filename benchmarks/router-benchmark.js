/**
 * Router Benchmark - Compare routing performance
 * Tests: @emberapi/router vs find-my-way
 */

const { Router } = require('@emberapi/router');
const FindMyWay = require('find-my-way');

// Benchmark configuration
const ITERATIONS = 1000000;
const WARMUP_ITERATIONS = 10000;

// Test routes
const routes = [
    { method: 'GET', path: '/' },
    { method: 'GET', path: '/users' },
    { method: 'GET', path: '/users/:id' },
    { method: 'POST', path: '/users' },
    { method: 'GET', path: '/users/:id/posts' },
    { method: 'GET', path: '/users/:id/posts/:postId' },
    { method: 'GET', path: '/api/v1/products' },
    { method: 'GET', path: '/api/v1/products/:id' },
    { method: 'GET', path: '/api/v1/categories/:category/products' },
    { method: 'GET', path: '/api/v2/search' },
    { method: 'GET', path: '/files/*path' },
    { method: 'POST', path: '/api/v1/auth/login' },
    { method: 'POST', path: '/api/v1/auth/register' },
    { method: 'GET', path: '/api/v1/users/:userId/settings' },
    { method: 'PUT', path: '/api/v1/users/:userId/profile' },
    { method: 'DELETE', path: '/api/v1/users/:userId' },
    { method: 'GET', path: '/api/v1/posts/:postId/comments' },
    { method: 'POST', path: '/api/v1/posts/:postId/comments' },
    { method: 'GET', path: '/health' },
];

// Test URLs to match
const testUrls = [
    { method: 'GET', url: '/' },
    { method: 'GET', url: '/users' },
    { method: 'GET', url: '/users/123' },
    { method: 'POST', url: '/users' },
    { method: 'GET', url: '/users/456/posts' },
    { method: 'GET', url: '/users/789/posts/101' },
    { method: 'GET', url: '/api/v1/products' },
    { method: 'GET', url: '/api/v1/products/abc123' },
    { method: 'GET', url: '/api/v1/categories/electronics/products' },
    { method: 'GET', url: '/api/v2/search?q=test' },
    { method: 'GET', url: '/files/documents/report.pdf' },
    { method: 'POST', url: '/api/v1/auth/login' },
    { method: 'POST', url: '/api/v1/auth/register' },
    { method: 'GET', url: '/api/v1/users/user123/settings' },
    { method: 'PUT', url: '/api/v1/users/user456/profile' },
    { method: 'DELETE', url: '/api/v1/users/user789' },
    { method: 'GET', url: '/api/v1/posts/post123/comments' },
    { method: 'POST', url: '/api/v1/posts/post456/comments' },
    { method: 'GET', url: '/health' },
];

// Dummy handler
const handler = () => { };

// Setup EmberAPI Router
function setupEmberRouter() {
    const router = new Router();

    for (const route of routes) {
        router[route.method.toLowerCase()](route.path, handler);
    }

    router.forge();
    return router;
}

// Setup find-my-way
function setupFindMyWay() {
    const router = FindMyWay();

    for (const route of routes) {
        // Convert EmberAPI wildcard syntax to find-my-way syntax
        let path = route.path;
        if (path.includes('*')) {
            // find-my-way uses just * at the end, not *paramName
            path = path.replace(/\/\*\w+$/, '/*');
        }
        router.on(route.method, path, handler);
    }

    return router;
}

// Benchmark function
function benchmark(name, fn, iterations) {
    // Warmup
    for (let i = 0; i < WARMUP_ITERATIONS; i++) {
        fn();
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

// Run benchmarks
console.log('🔥 EmberAPI Router Benchmark\n');
console.log('Setting up routers...\n');

const emberRouter = setupEmberRouter();
const findMyWayRouter = setupFindMyWay();

console.log('Routes registered:', routes.length);
console.log('Test URLs:', testUrls.length);
console.log('Iterations per test:', ITERATIONS.toLocaleString());
console.log('Warmup iterations:', WARMUP_ITERATIONS.toLocaleString());
console.log('\n' + '='.repeat(80) + '\n');

// Benchmark 1: Static route matching
console.log('📊 Benchmark 1: Static Route Matching (GET /)');
console.log('-'.repeat(80));

const ember1 = benchmark(
    '@emberapi/router',
    () => emberRouter.find('GET', '/'),
    ITERATIONS
);

const fmw1 = benchmark(
    'find-my-way',
    () => findMyWayRouter.find('GET', '/'),
    ITERATIONS
);

console.log(`${ember1.name.padEnd(20)} ${ember1.opsPerSec.padStart(15)} ops/sec (${ember1.duration}ms)`);
console.log(`${fmw1.name.padEnd(20)} ${fmw1.opsPerSec.padStart(15)} ops/sec (${fmw1.duration}ms)`);
console.log(`Winner: ${Number(ember1.opsPerSec) > Number(fmw1.opsPerSec) ? '🔥 @emberapi/router' : 'find-my-way'} (${(Math.max(Number(ember1.opsPerSec), Number(fmw1.opsPerSec)) / Math.min(Number(ember1.opsPerSec), Number(fmw1.opsPerSec))).toFixed(2)}x faster)`);
console.log('\n');

// Benchmark 2: Parametric route matching
console.log('📊 Benchmark 2: Parametric Route Matching (GET /users/:id)');
console.log('-'.repeat(80));

const ember2 = benchmark(
    '@emberapi/router',
    () => emberRouter.find('GET', '/users/123'),
    ITERATIONS
);

const fmw2 = benchmark(
    'find-my-way',
    () => findMyWayRouter.find('GET', '/users/123'),
    ITERATIONS
);

console.log(`${ember2.name.padEnd(20)} ${ember2.opsPerSec.padStart(15)} ops/sec (${ember2.duration}ms)`);
console.log(`${fmw2.name.padEnd(20)} ${fmw2.opsPerSec.padStart(15)} ops/sec (${fmw2.duration}ms)`);
console.log(`Winner: ${Number(ember2.opsPerSec) > Number(fmw2.opsPerSec) ? '🔥 @emberapi/router' : 'find-my-way'} (${(Math.max(Number(ember2.opsPerSec), Number(fmw2.opsPerSec)) / Math.min(Number(ember2.opsPerSec), Number(fmw2.opsPerSec))).toFixed(2)}x faster)`);
console.log('\n');

// Benchmark 3: Nested parametric routes
console.log('📊 Benchmark 3: Nested Parametric Routes (GET /users/:id/posts/:postId)');
console.log('-'.repeat(80));

const ember3 = benchmark(
    '@emberapi/router',
    () => emberRouter.find('GET', '/users/789/posts/101'),
    ITERATIONS
);

const fmw3 = benchmark(
    'find-my-way',
    () => findMyWayRouter.find('GET', '/users/789/posts/101'),
    ITERATIONS
);

console.log(`${ember3.name.padEnd(20)} ${ember3.opsPerSec.padStart(15)} ops/sec (${ember3.duration}ms)`);
console.log(`${fmw3.name.padEnd(20)} ${fmw3.opsPerSec.padStart(15)} ops/sec (${fmw3.duration}ms)`);
console.log(`Winner: ${Number(ember3.opsPerSec) > Number(fmw3.opsPerSec) ? '🔥 @emberapi/router' : 'find-my-way'} (${(Math.max(Number(ember3.opsPerSec), Number(fmw3.opsPerSec)) / Math.min(Number(ember3.opsPerSec), Number(fmw3.opsPerSec))).toFixed(2)}x faster)`);
console.log('\n');

// Benchmark 4: Wildcard routes
console.log('📊 Benchmark 4: Wildcard Routes (GET /files/*path)');
console.log('-'.repeat(80));

const ember4 = benchmark(
    '@emberapi/router',
    () => emberRouter.find('GET', '/files/documents/report.pdf'),
    ITERATIONS
);

const fmw4 = benchmark(
    'find-my-way',
    () => findMyWayRouter.find('GET', '/files/documents/report.pdf'),
    ITERATIONS
);

console.log(`${ember4.name.padEnd(20)} ${ember4.opsPerSec.padStart(15)} ops/sec (${ember4.duration}ms)`);
console.log(`${fmw4.name.padEnd(20)} ${fmw4.opsPerSec.padStart(15)} ops/sec (${fmw4.duration}ms)`);
console.log(`Winner: ${Number(ember4.opsPerSec) > Number(fmw4.opsPerSec) ? '🔥 @emberapi/router' : 'find-my-way'} (${(Math.max(Number(ember4.opsPerSec), Number(fmw4.opsPerSec)) / Math.min(Number(ember4.opsPerSec), Number(fmw4.opsPerSec))).toFixed(2)}x faster)`);
console.log('\n');

// Benchmark 5: Mixed routes (realistic scenario)
console.log('📊 Benchmark 5: Mixed Routes (All test URLs)');
console.log('-'.repeat(80));

const ember5 = benchmark(
    '@emberapi/router',
    () => {
        for (const test of testUrls) {
            emberRouter.find(test.method, test.url);
        }
    },
    ITERATIONS / 10 // Reduce iterations for mixed test
);

const fmw5 = benchmark(
    'find-my-way',
    () => {
        for (const test of testUrls) {
            findMyWayRouter.find(test.method, test.url);
        }
    },
    ITERATIONS / 10
);

console.log(`${ember5.name.padEnd(20)} ${ember5.opsPerSec.padStart(15)} ops/sec (${ember5.duration}ms)`);
console.log(`${fmw5.name.padEnd(20)} ${fmw5.opsPerSec.padStart(15)} ops/sec (${fmw5.duration}ms)`);
console.log(`Winner: ${Number(ember5.opsPerSec) > Number(fmw5.opsPerSec) ? '🔥 @emberapi/router' : 'find-my-way'} (${(Math.max(Number(ember5.opsPerSec), Number(fmw5.opsPerSec)) / Math.min(Number(ember5.opsPerSec), Number(fmw5.opsPerSec))).toFixed(2)}x faster)`);
console.log('\n');

// Summary
console.log('='.repeat(80));
console.log('📈 SUMMARY\n');

const emberWins = [ember1, ember2, ember3, ember4, ember5].filter((r, i) =>
    Number(r.opsPerSec) > Number([fmw1, fmw2, fmw3, fmw4, fmw5][i].opsPerSec)
).length;

const avgEmberOps = ([ember1, ember2, ember3, ember4, ember5].reduce((sum, r) => sum + Number(r.opsPerSec), 0) / 5).toFixed(0);
const avgFmwOps = ([fmw1, fmw2, fmw3, fmw4, fmw5].reduce((sum, r) => sum + Number(r.opsPerSec), 0) / 5).toFixed(0);

console.log(`@emberapi/router wins: ${emberWins}/5 benchmarks`);
console.log(`find-my-way wins: ${5 - emberWins}/5 benchmarks`);
console.log('');
console.log(`Average @emberapi/router: ${avgEmberOps} ops/sec`);
console.log(`Average find-my-way: ${avgFmwOps} ops/sec`);
console.log('');
console.log(`Overall winner: ${Number(avgEmberOps) > Number(avgFmwOps) ? '🔥 @emberapi/router' : 'find-my-way'}`);
console.log('='.repeat(80));
