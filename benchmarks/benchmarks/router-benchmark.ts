/**
 * 🔥 Router Benchmark: EmberAPI Router vs find-my-way
 * 
 * Compares the performance of @emberapi/router against find-my-way,
 * which is used by Fastify and is known for its speed.
 */

import { Router } from '@emberapi/router';
import FindMyWay from 'find-my-way';

// Number of iterations for each test
const ITERATIONS = 1_000_000;

// Test routes
const routes = [
    { method: 'GET', path: '/' },
    { method: 'GET', path: '/users' },
    { method: 'GET', path: '/users/:id' },
    { method: 'POST', path: '/users' },
    { method: 'GET', path: '/users/:id/posts' },
    { method: 'GET', path: '/users/:id/posts/:postId' },
    { method: 'GET', path: '/posts/:id/comments/:commentId' },
    { method: 'GET', path: '/api/v1/health' },
    { method: 'GET', path: '/api/v1/status' },
    { method: 'GET', path: '/api/v2/users/:id' },
    { method: 'GET', path: '/files/*' },
    { method: 'DELETE', path: '/users/:id' },
    { method: 'PUT', path: '/users/:id' },
    { method: 'PATCH', path: '/users/:id' },
];

// Test requests
const testRequests = [
    { method: 'GET', path: '/' },
    { method: 'GET', path: '/users' },
    { method: 'GET', path: '/users/123' },
    { method: 'POST', path: '/users' },
    { method: 'GET', path: '/users/123/posts' },
    { method: 'GET', path: '/users/123/posts/456' },
    { method: 'GET', path: '/posts/1/comments/5' },
    { method: 'GET', path: '/api/v1/health' },
    { method: 'GET', path: '/api/v2/users/789' },
    { method: 'GET', path: '/files/documents/report.pdf' },
    { method: 'DELETE', path: '/users/999' },
];

/**
 * Setup EmberAPI Router
 */
function setupEmberRouter(): Router {
    const router = new Router();
    const handler = () => ({ success: true });

    routes.forEach(route => {
        const method = route.method.toLowerCase() as 'get' | 'post' | 'delete' | 'put' | 'patch';
        router[method](route.path, handler);
    });

    router.forge(); // Pre-compile routes
    return router;
}

/**
 * Setup find-my-way Router
 */
function setupFindMyWay(): FindMyWay.Instance<FindMyWay.HTTPVersion.V1> {
    const router = FindMyWay();
    const handler = () => ({ success: true });

    routes.forEach(route => {
        router.on(route.method, route.path, handler);
    });

    return router;
}

/**
 * Benchmark a router
 */
function benchmarkRouter(
    name: string,
    router: Router | FindMyWay.Instance<FindMyWay.HTTPVersion.V1>,
    isEmberRouter: boolean
): number {
    console.log(`\n🔥 Benchmarking ${name}...`);

    const startTime = performance.now();

    for (let i = 0; i < ITERATIONS; i++) {
        const req = testRequests[i % testRequests.length];

        if (isEmberRouter) {
            (router as Router).match(req.method, req.path);
        } else {
            (router as FindMyWay.Instance<FindMyWay.HTTPVersion.V1>).find(req.method, req.path);
        }
    }

    const endTime = performance.now();
    const duration = endTime - startTime;
    const opsPerSecond = (ITERATIONS / duration) * 1000;

    console.log(`  ⏱️  Time: ${duration.toFixed(2)}ms`);
    console.log(`  🚀 Ops/sec: ${opsPerSecond.toLocaleString('en-US', { maximumFractionDigits: 0 })}`);
    console.log(`  📊 Avg time per op: ${(duration / ITERATIONS * 1000).toFixed(3)}μs`);

    return opsPerSecond;
}

/**
 * Run benchmarks
 */
async function runBenchmarks() {
    console.log('🔥🔥🔥 Router Benchmark Suite 🔥🔥🔥\n');
    console.log(`Iterations: ${ITERATIONS.toLocaleString('en-US')}`);
    console.log(`Routes: ${routes.length}`);
    console.log(`Test requests: ${testRequests.length}`);
    console.log('='.repeat(60));

    // Setup routers
    const emberRouter = setupEmberRouter();
    const findMyWayRouter = setupFindMyWay();

    // Warm up
    console.log('\n🔥 Warming up...');
    for (let i = 0; i < 10000; i++) {
        const req = testRequests[i % testRequests.length];
        emberRouter.match(req.method, req.path);
        findMyWayRouter.find(req.method, req.path);
    }

    // Run benchmarks
    const emberOps = benchmarkRouter('EmberAPI Router', emberRouter, true);
    const findMyWayOps = benchmarkRouter('find-my-way', findMyWayRouter, false);

    // Compare results
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 Comparison\n');

    const difference = emberOps - findMyWayOps;
    const percentDiff = ((difference / findMyWayOps) * 100);

    console.log(`EmberAPI Router:  ${emberOps.toLocaleString('en-US', { maximumFractionDigits: 0 })} ops/sec`);
    console.log(`find-my-way:      ${findMyWayOps.toLocaleString('en-US', { maximumFractionDigits: 0 })} ops/sec`);
    console.log(`\nDifference:       ${Math.abs(difference).toLocaleString('en-US', { maximumFractionDigits: 0 })} ops/sec`);

    if (percentDiff > 0) {
        console.log(`\n🔥 EmberAPI Router is ${percentDiff.toFixed(2)}% FASTER! 🔥`);
    } else {
        console.log(`\n📊 find-my-way is ${Math.abs(percentDiff).toFixed(2)}% faster`);
    }

    console.log('\n' + '='.repeat(60));

    // Detailed route matching test
    console.log('\n📋 Detailed Route Matching Test\n');

    testRequests.forEach(req => {
        const emberStart = performance.now();
        for (let i = 0; i < 100000; i++) {
            emberRouter.match(req.method, req.path);
        }
        const emberTime = performance.now() - emberStart;

        const fmwStart = performance.now();
        for (let i = 0; i < 100000; i++) {
            findMyWayRouter.find(req.method, req.path);
        }
        const fmwTime = performance.now() - fmwStart;

        const faster = emberTime < fmwTime ? 'EmberAPI' : 'find-my-way';
        const diff = Math.abs(emberTime - fmwTime);

        console.log(`${req.method.padEnd(6)} ${req.path.padEnd(35)} | Ember: ${emberTime.toFixed(2)}ms | FMW: ${fmwTime.toFixed(2)}ms | ${faster} +${diff.toFixed(2)}ms`);
    });

    console.log('\n🔥 Router benchmark complete!\n');
}

// Run the benchmarks
runBenchmarks().catch(console.error);
