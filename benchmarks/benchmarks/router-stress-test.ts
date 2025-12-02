/**
 * 🔥 Router Stress Test: EmberAPI Router vs find-my-way
 * 
 * Tests performance with MASSIVE route sets and complex patterns
 * to demonstrate O(log n) scalability advantages
 */

import { Router } from '@emberapi/router';
import FindMyWay from 'find-my-way';

// Number of iterations for each test
const ITERATIONS = 1_000_000;

/**
 * Generate a large, realistic route set
 */
function generateLargeRouteSet(count: number) {
    const routes: Array<{ method: string; path: string }> = [];
    const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

    // API versioning routes
    for (let v = 1; v <= 5; v++) {
        routes.push({ method: 'GET', path: `/api/v${v}/health` });
        routes.push({ method: 'GET', path: `/api/v${v}/status` });
        routes.push({ method: 'GET', path: `/api/v${v}/metrics` });
    }

    // Resource routes with deep nesting
    const resources = ['users', 'posts', 'comments', 'products', 'orders', 'invoices', 'customers', 'suppliers'];
    for (const resource of resources) {
        routes.push({ method: 'GET', path: `/${resource}` });
        routes.push({ method: 'GET', path: `/${resource}/:id` });
        routes.push({ method: 'POST', path: `/${resource}` });
        routes.push({ method: 'PUT', path: `/${resource}/:id` });
        routes.push({ method: 'DELETE', path: `/${resource}/:id` });
        routes.push({ method: 'PATCH', path: `/${resource}/:id` });

        // Nested resources
        for (const nested of ['items', 'details', 'history', 'analytics']) {
            routes.push({ method: 'GET', path: `/${resource}/:id/${nested}` });
            routes.push({ method: 'GET', path: `/${resource}/:id/${nested}/:itemId` });
            routes.push({ method: 'POST', path: `/${resource}/:id/${nested}` });
            routes.push({ method: 'PUT', path: `/${resource}/:id/${nested}/:itemId` });
            routes.push({ method: 'DELETE', path: `/${resource}/:id/${nested}/:itemId` });
        }
    }

    // Deep nested routes (simulating complex APIs) - make each unique
    for (let i = 0; i < 50; i++) {
        routes.push({ method: 'GET', path: `/orgs${i}/:orgId/teams/:teamId/projects/:projectId/tasks/:taskId` });
        routes.push({ method: 'GET', path: `/companies${i}/:companyId/departments/:deptId/employees/:empId/reviews/:reviewId` });
        routes.push({ method: 'GET', path: `/stores${i}/:storeId/categories/:catId/products/:prodId/variants/:varId` });
    }

    // Admin routes
    for (let i = 0; i < 100; i++) {
        routes.push({ method: 'GET', path: `/admin/module${i}/action${i}` });
        routes.push({ method: 'POST', path: `/admin/module${i}/action${i}` });
    }

    // Webhook routes
    for (let i = 0; i < 50; i++) {
        routes.push({ method: 'POST', path: `/webhooks/service${i}/event${i}` });
    }

    // File routes with wildcards
    routes.push({ method: 'GET', path: '/static/*' });
    routes.push({ method: 'GET', path: '/files/*' });
    routes.push({ method: 'GET', path: '/assets/*' });
    routes.push({ method: 'GET', path: '/downloads/*' });

    // Fill up to desired count
    while (routes.length < count) {
        const idx = routes.length;
        const method = methods[idx % methods.length];
        routes.push({ method, path: `/route${idx}/sub${idx}/:param${idx}` });
    }

    return routes.slice(0, count);
}

/**
 * Generate test requests that hit various parts of the route tree
 */
function generateTestRequests(routeCount: number) {
    return [
        { method: 'GET', path: '/' },
        { method: 'GET', path: '/api/v1/health' },
        { method: 'GET', path: '/api/v3/status' },
        { method: 'GET', path: '/users' },
        { method: 'GET', path: '/users/12345' },
        { method: 'POST', path: '/users' },
        { method: 'GET', path: '/users/123/items' },
        { method: 'GET', path: '/users/123/items/456' },
        { method: 'GET', path: '/products/789/details/abc' },
        { method: 'GET', path: '/orgs0/org1/teams/team2/projects/proj3/tasks/task4' },
        { method: 'GET', path: '/companies0/comp1/departments/dept2/employees/emp3/reviews/rev4' },
        { method: 'GET', path: '/stores0/store1/categories/cat2/products/prod3/variants/var4' },
        { method: 'GET', path: '/admin/module50/action50' },
        { method: 'POST', path: '/webhooks/service25/event25' },
        { method: 'GET', path: '/static/css/main.css' },
        { method: 'GET', path: '/files/documents/reports/2024/annual.pdf' },
        { method: 'GET', path: `/route${routeCount - 100}/sub${routeCount - 100}/param123` },
    ];
}

/**
 * Setup EmberAPI Router
 */
function setupEmberRouter(routes: Array<{ method: string; path: string }>): Router {
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
function setupFindMyWay(routes: Array<{ method: string; path: string }>): FindMyWay.Instance<FindMyWay.HTTPVersion.V1> {
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
    isEmberRouter: boolean,
    testRequests: Array<{ method: string; path: string }>
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
 * Run stress tests with different route counts
 */
async function runStressTests() {
    console.log('🔥🔥🔥 Router Stress Test Suite 🔥🔥🔥\n');
    console.log('Testing O(log n) scalability with massive route sets\n');
    console.log(`Iterations per test: ${ITERATIONS.toLocaleString('en-US')}`);
    console.log('='.repeat(70));

    const routeCounts = [50, 100, 500, 1000];
    const results: Array<{ count: number; ember: number; fmw: number }> = [];

    for (const count of routeCounts) {
        console.log(`\n${'='.repeat(70)}`);
        console.log(`\n📊 Testing with ${count} routes\n`);

        const routes = generateLargeRouteSet(count);
        const testRequests = generateTestRequests(count);

        console.log(`Routes generated: ${routes.length}`);
        console.log(`Test requests: ${testRequests.length}`);

        // Setup routers
        const emberRouter = setupEmberRouter(routes);
        const findMyWayRouter = setupFindMyWay(routes);

        // Warm up
        console.log('\n🔥 Warming up...');
        for (let i = 0; i < 10000; i++) {
            const req = testRequests[i % testRequests.length];
            emberRouter.match(req.method, req.path);
            findMyWayRouter.find(req.method, req.path);
        }

        // Run benchmarks
        const emberOps = benchmarkRouter('EmberAPI Router', emberRouter, true, testRequests);
        const fmwOps = benchmarkRouter('find-my-way', findMyWayRouter, false, testRequests);

        results.push({ count, ember: emberOps, fmw: fmwOps });

        // Show comparison
        const difference = emberOps - fmwOps;
        const percentDiff = ((difference / fmwOps) * 100);

        console.log(`\n📊 Result:`);
        if (percentDiff > 0) {
            console.log(`   🔥 EmberAPI is ${percentDiff.toFixed(2)}% FASTER with ${count} routes!`);
        } else {
            console.log(`   📊 find-my-way is ${Math.abs(percentDiff).toFixed(2)}% faster with ${count} routes`);
        }
    }

    // Final comparison
    console.log(`\n${'='.repeat(70)}`);
    console.log('\n📈 Scalability Analysis\n');
    console.log('Routes | EmberAPI (ops/s) | find-my-way (ops/s) | Difference');
    console.log('-'.repeat(70));

    results.forEach(r => {
        const diff = ((r.ember - r.fmw) / r.fmw * 100);
        const diffStr = diff > 0 ? `+${diff.toFixed(2)}%` : `${diff.toFixed(2)}%`;
        console.log(
            `${String(r.count).padEnd(6)} | ${r.ember.toLocaleString('en-US', { maximumFractionDigits: 0 }).padEnd(16)} | ` +
            `${r.fmw.toLocaleString('en-US', { maximumFractionDigits: 0 }).padEnd(19)} | ${diffStr}`
        );
    });

    console.log('\n' + '='.repeat(70));
    console.log('\n🔥 Stress test complete!\n');

    // Analyze scalability
    console.log('💡 Scalability Insights:\n');
    const emberDegradation = ((results[0].ember - results[results.length - 1].ember) / results[0].ember * 100);
    const fmwDegradation = ((results[0].fmw - results[results.length - 1].fmw) / results[0].fmw * 100);

    console.log(`EmberAPI performance degradation: ${emberDegradation.toFixed(2)}%`);
    console.log(`find-my-way performance degradation: ${fmwDegradation.toFixed(2)}%`);

    if (emberDegradation < fmwDegradation) {
        console.log(`\n🔥 EmberAPI scales BETTER! (${(fmwDegradation - emberDegradation).toFixed(2)}% better scaling)`);
    } else {
        console.log(`\n📊 find-my-way scales better (${(emberDegradation - fmwDegradation).toFixed(2)}% better scaling)`);
    }

    console.log('\n');
}

// Run the stress tests
runStressTests().catch(console.error);
