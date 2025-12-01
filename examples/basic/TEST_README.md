# 🔥 EmberAPI Example - Test Suite

This directory contains a comprehensive test script for the EmberAPI example application.

## Running the Tests

### Step 1: Start the Server

In one terminal, start the development server:

```bash
pnpm run dev
```

Wait for the server to start. You should see:

```
🔥 EmberAPI launched on http://localhost:3000
🔥🔥🔥 EmberAPI is blazing! 🔥🔥🔥
```

### Step 2: Run the Tests

In a **separate terminal**, run the test script:

```bash
pnpm run test
```

## What Gets Tested

The test script validates all endpoints in the example application:

### ✅ Basic Routes
- `GET /` - Home page with endpoint list
- `GET /users/:id` - User by ID (tests route parameters)
- `GET /users?filter=active&sort=name` - Users list (tests query parameters)
- `POST /users` - Create user (tests POST with JSON body)

### ✅ Advanced Routes
- `GET /posts/:id/comments/:commentId` - Nested parameters
- `GET /html` - HTML response

### ✅ API Routes (v1)
- `GET /api/v1/health` - Health check endpoint
- `GET /api/v1/status` - Status with uptime and memory

### ✅ API Routes (v2)
- `GET /api/v2/users` - Users list (v2)
- `GET /api/v2/users/:id` - User by ID (v2)

### ✅ Special Routes
- `GET /files/*` - Wildcard route matching
- `GET /this-does-not-exist` - 404 handling

## Expected Output

```
🔥🔥🔥 EmberAPI Test Suite 🔥🔥🔥

Testing server at: http://localhost:3000

============================================================

🔥 Testing GET /
✅ Status: 200
📦 Response: { message: 'Welcome to EmberAPI! 🔥', endpoints: [...] }

🔥 Testing GET /users/123
✅ Status: 200
📦 Response: { userId: '123', message: 'Fetching user 123' }

... (more tests)

============================================================

📊 Test Summary

Total Tests: 13
✅ Passed: 12
❌ Failed: 1
Success Rate: 92.3%

📋 Detailed Results:

✅ Test 1: GET / - Status 200
✅ Test 2: GET /users/123 - Status 200
✅ Test 3: GET /users?filter=active&sort=name - Status 200
...

============================================================

🔥 Testing complete!
```

## Test Script Features

- **Automatic endpoint testing**: Tests all major routes
- **Request/Response validation**: Checks status codes and response data
- **Query parameter testing**: Validates query string handling
- **POST request testing**: Tests JSON body parsing
- **Wildcard route testing**: Validates dynamic path matching
- **Error handling**: Tests 404 responses
- **Summary report**: Shows pass/fail statistics
- **Detailed logging**: Displays request/response for each test

## Customizing Tests

Edit `test.ts` to add more tests:

```typescript
// Add a new test
await test('/your-endpoint', 'GET');

// Test with POST data
await test('/your-endpoint', 'POST', {
  key: 'value'
});
```

## Troubleshooting

### Server not running
```
❌ Error: fetch failed
```
**Solution**: Make sure the dev server is running on port 3000

### Port already in use
```
Error: listen EADDRINUSE: address already in use :::3000
```
**Solution**: Kill the process using port 3000 or change the port in both `src/index.ts` and `test.ts`

### Tests failing
Check the server logs in the dev terminal to see what errors occurred during the test requests.

## Next Steps

- Add more test cases for edge cases
- Implement integration tests
- Add performance benchmarks
- Create automated CI/CD pipeline

---

**Happy testing! 🔥**
