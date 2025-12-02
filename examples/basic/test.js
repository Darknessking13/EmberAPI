// Test script for EmberAPI
const http = require('http');

const BASE_URL = 'http://localhost:3000';

async function testRoute(method, path, body = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE_URL);
        const options = {
            method,
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            headers: {
                'Content-Type': 'application/json',
                ...headers,
            },
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => (data += chunk));
            res.on('end', () => {
                try {
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        body: JSON.parse(data),
                    });
                } catch (e) {
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        body: data,
                    });
                }
            });
        });

        req.on('error', reject);

        if (body) {
            req.write(JSON.stringify(body));
        }

        req.end();
    });
}

async function runTests() {
    console.log('🧪 Testing EmberAPI routes...\n');

    // Test 1: Root route
    console.log('1️⃣  Testing GET /');
    const test1 = await testRoute('GET', '/');
    console.log(`   Status: ${test1.status}`);
    console.log(`   Body:`, test1.body);
    console.log('');

    // Test 2: Route with parameters
    console.log('2️⃣  Testing GET /users/123');
    const test2 = await testRoute('GET', '/users/123');
    console.log(`   Status: ${test2.status}`);
    console.log(`   Body:`, test2.body);
    console.log('');

    // Test 3: Route with query parameters
    console.log('3️⃣  Testing GET /search?q=emberapi&filter=active');
    const test3 = await testRoute('GET', '/search?q=emberapi&filter=active');
    console.log(`   Status: ${test3.status}`);
    console.log(`   Body:`, test3.body);
    console.log('');

    // Test 4: POST route
    console.log('4️⃣  Testing POST /users');
    const test4 = await testRoute('POST', '/users', {
        name: 'Jane Doe',
        email: 'jane@example.com',
    });
    console.log(`   Status: ${test4.status}`);
    console.log(`   Body:`, test4.body);
    console.log('');

    // Test 5: API status
    console.log('5️⃣  Testing GET /api/status');
    const test5 = await testRoute('GET', '/api/status');
    console.log(`   Status: ${test5.status}`);
    console.log(`   Body:`, test5.body);
    console.log('');

    // Test 6: API version
    console.log('6️⃣  Testing GET /api/version');
    const test6 = await testRoute('GET', '/api/version');
    console.log(`   Status: ${test6.status}`);
    console.log(`   Body:`, test6.body);
    console.log('');

    // Test 7: Protected route without auth (should fail)
    console.log('7️⃣  Testing GET /api/v1/protected (no auth)');
    const test7 = await testRoute('GET', '/api/v1/protected');
    console.log(`   Status: ${test7.status}`);
    console.log(`   Body:`, test7.body);
    console.log('');

    // Test 8: Protected route with auth
    console.log('8️⃣  Testing GET /api/v1/protected (with auth)');
    const test8 = await testRoute('GET', '/api/v1/protected', null, {
        authorization: 'Bearer test-token',
    });
    console.log(`   Status: ${test8.status}`);
    console.log(`   Body:`, test8.body);
    console.log('');

    // Test 9: Nested route with params
    console.log('9️⃣  Testing GET /api/v1/posts/456');
    const test9 = await testRoute('GET', '/api/v1/posts/456');
    console.log(`   Status: ${test9.status}`);
    console.log(`   Body:`, test9.body);
    console.log('');

    // Test 10: Wildcard route
    console.log('🔟 Testing GET /files/documents/report.pdf');
    const test10 = await testRoute('GET', '/files/documents/report.pdf');
    console.log(`   Status: ${test10.status}`);
    console.log(`   Body:`, test10.body);
    console.log('');

    // Test 11: 404 route
    console.log('1️⃣1️⃣  Testing GET /nonexistent');
    const test11 = await testRoute('GET', '/nonexistent');
    console.log(`   Status: ${test11.status}`);
    console.log(`   Body:`, test11.body);
    console.log('');

    console.log('✅ All tests completed!');
}

runTests().catch(console.error);
