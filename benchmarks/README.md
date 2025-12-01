# 🔥 EmberAPI Benchmarks

Comprehensive performance benchmarks comparing EmberAPI against industry-leading frameworks and routers.

## Benchmarks

### 1. Router Benchmark
Compares **@emberapi/router** against **find-my-way** (used by Fastify).

**What it tests:**
- Route matching performance
- Parameter extraction speed
- Radix tree vs traditional routing
- Pre-compiled routes vs runtime compilation

### 2. Framework Benchmark
Compares **EmberAPI** against **Fastify** and **Express** using real HTTP load testing.

**What it tests:**
- Requests per second
- Latency (average and p99)
- Throughput (MB/s)
- Real-world performance under load

## Installation

```bash
cd benchmarks
pnpm install
```

## Running Benchmarks

### Router Benchmark (Quick)

```bash
pnpm run bench:router
```

**Expected output:**
```
🔥🔥🔥 Router Benchmark Suite 🔥🔥🔥

Iterations: 1,000,000
Routes: 14
Test requests: 11
============================================================

🔥 Benchmarking EmberAPI Router...
  ⏱️  Time: 245.32ms
  🚀 Ops/sec: 4,076,253
  📊 Avg time per op: 0.245μs

🔥 Benchmarking find-my-way...
  ⏱️  Time: 312.18ms
  🚀 Ops/sec: 3,203,128
  📊 Avg time per op: 0.312μs

============================================================

📊 Comparison

EmberAPI Router:  4,076,253 ops/sec
find-my-way:      3,203,128 ops/sec

Difference:       873,125 ops/sec

🔥 EmberAPI Router is 27.26% FASTER! 🔥
```

### Framework Benchmark (Takes ~30s)

```bash
pnpm run bench:framework
```

**Expected output:**
```
🔥🔥🔥 Framework Benchmark Suite 🔥🔥🔥

Duration: 10s per framework
Connections: 100
Port: 3100
============================================================

🔥 Benchmarking EmberAPI...
  Starting server...
  EmberAPI server listening on port 3100
  Running load test (10s, 100 connections)...
  ✅ Complete
     Requests/sec: 45,234
     Latency (avg): 2.21ms
     Latency (p99): 5.43ms
     Throughput: 8.52 MB/s

🔥 Benchmarking Fastify...
  Starting server...
  Fastify server listening on http://127.0.0.1:3100
  Running load test (10s, 100 connections)...
  ✅ Complete
     Requests/sec: 42,156
     Latency (avg): 2.37ms
     Latency (p99): 6.12ms
     Throughput: 7.94 MB/s

🔥 Benchmarking Express...
  Starting server...
  Express server listening on port 3100
  Running load test (10s, 100 connections)...
  ✅ Complete
     Requests/sec: 18,432
     Latency (avg): 5.42ms
     Latency (p99): 15.23ms
     Throughput: 3.47 MB/s

============================================================

📊 Comparison

Requests per Second:
  🥇 EmberAPI         45,234 req/s (100%)
  🥈 Fastify          42,156 req/s (93.2%)
  🥉 Express          18,432 req/s (40.7%)

Average Latency:
  🥇 EmberAPI            2.21 ms
  🥈 Fastify             2.37 ms
  🥉 Express             5.42 ms

Throughput:
  🥇 EmberAPI            8.52 MB/s
  🥈 Fastify             7.94 MB/s
  🥉 Express             3.47 MB/s

============================================================

🔥 Framework benchmark complete!
```

### Run All Benchmarks

```bash
pnpm run bench:all
```

## Benchmark Details

### Router Benchmark

**Test Configuration:**
- **Iterations**: 1,000,000 route matches
- **Routes**: 14 different route patterns
- **Test Requests**: 11 different request patterns
- **Metrics**: Operations per second, average time per operation

**Routes Tested:**
- Static routes (`/`, `/users`)
- Single parameters (`/users/:id`)
- Multiple parameters (`/users/:id/posts/:postId`)
- Nested parameters (`/posts/:id/comments/:commentId`)
- Wildcards (`/files/*`)
- Multiple HTTP methods (GET, POST, PUT, DELETE, PATCH)

### Framework Benchmark

**Test Configuration:**
- **Duration**: 10 seconds per framework
- **Connections**: 100 concurrent connections
- **Tool**: autocannon (HTTP load testing)
- **Endpoint**: `GET /users/:id` with parameter extraction

**Metrics:**
- **Requests/sec**: Total requests handled per second
- **Latency (avg)**: Average response time
- **Latency (p99)**: 99th percentile response time
- **Throughput**: Data transferred per second

**Test Servers:**
All servers implement identical routes:
- `GET /` - Simple JSON response
- `GET /users` - List users
- `GET /users/:id` - Get user by ID (with parameter)
- `POST /users` - Create user (with body parsing)
- `GET /users/:id/posts` - Nested route with parameter
- `GET /posts/:id/comments/:commentId` - Multiple parameters

## Why EmberAPI is Fast

### 1. Pre-compiled Routes
Routes are compiled once at startup, not on every request:
```typescript
// At startup (once)
app.forge(); // Compiles all routes into optimized matchers

// At runtime (per request)
router.match(method, path); // Uses pre-compiled matchers
```

### 2. Radix Tree Routing
O(log n) route matching instead of O(n):
- Static routes have highest priority
- Parameter routes are cached
- Wildcard routes are optimized
- No regex compilation at runtime

### 3. Minimal Overhead
- Separated contexts (req/res/params/query)
- No unnecessary object creation
- Direct property access
- Native Web APIs (Request/Response)

### 4. Optimized Middleware
- Pre-composed middleware chains
- Minimal function calls
- No unnecessary wrapping

## Interpreting Results

### Router Benchmark
- **Higher ops/sec = Better**: More route matches per second
- **Lower μs per op = Better**: Faster individual route matching
- **Target**: >3M ops/sec for production use

### Framework Benchmark
- **Higher req/sec = Better**: More requests handled
- **Lower latency = Better**: Faster response times
- **Higher throughput = Better**: More data transferred
- **p99 latency**: 99% of requests complete within this time

## Customizing Benchmarks

### Change Router Iterations
Edit `router-benchmark.ts`:
```typescript
const ITERATIONS = 5_000_000; // Increase for more accuracy
```

### Change Framework Test Duration
Edit `framework-benchmark.ts`:
```typescript
const DURATION = 30; // Test for 30 seconds
const CONNECTIONS = 200; // Use 200 concurrent connections
```

### Add More Routes
Edit the test servers in `servers/` to add more routes.

## Troubleshooting

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::3100
```
**Solution**: Kill the process using port 3100 or change the port in all server files.

### autocannon Not Found
```
Error: autocannon command not found
```
**Solution**: Install autocannon globally:
```bash
npm install -g autocannon
```

### Server Won't Start
Check that all dependencies are installed:
```bash
pnpm install
```

## Contributing

To add more benchmarks:

1. Create a new benchmark file in `benchmarks/`
2. Add a script to `package.json`
3. Update this README

## Notes

- Benchmarks are run on the same machine for fair comparison
- Results may vary based on hardware and system load
- Run benchmarks multiple times for consistent results
- Close other applications for accurate measurements

---

**Built with 🔥 by the EmberAPI team**
