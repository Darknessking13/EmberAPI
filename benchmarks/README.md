# 🔥 EmberAPI Benchmarks

Comprehensive benchmarking suite for EmberAPI framework and router.

## 📊 Available Benchmarks

### 1. Router Benchmark (`router-benchmark.js`)

Compares the **@emberapi/router** against **find-my-way** (used by Fastify).

**Tests:**
- Static route matching
- Parametric route matching
- Nested parametric routes
- Wildcard routes
- Mixed routes (realistic scenario)

**Run:**
```bash
npm run bench:router
```

### 2. Framework Benchmark (`framework-benchmark.js`)

Compares the full **EmberAPI** framework against **Express** using synthetic benchmarks.

**Tests:**
- Static routes
- Parametric routes
- POST routes
- Nested routes

**Run:**
```bash
npm run bench:framework
```

### 3. HTTP Benchmark (`http-benchmark.js`)

Real-world HTTP performance test using **autocannon** to benchmark actual HTTP servers.

**Compares:**
- EmberAPI
- Fastify
- Express

**Tests:**
- Static route (GET /)
- Parametric route (GET /users/:id)
- Nested route with query (GET /api/v1/products/:id?filter=active)

**Run:**
```bash
npm run bench:autocannon
```

## 🚀 Quick Start

```bash
# Install dependencies
cd benchmarks
pnpm install

# Run all benchmarks
npm run bench:all

# Or run individual benchmarks
npm run bench:router
npm run bench:framework
npm run bench:autocannon
```

## 📈 Understanding Results

### Router Benchmark

- **ops/sec**: Operations per second (higher is better)
- Tests pure routing performance without HTTP overhead
- Shows how fast the router can match URLs to handlers

### Framework Benchmark

- **ops/sec**: Operations per second (higher is better)
- Tests the full framework stack (routing + request/response handling)
- Synthetic benchmark using mock request/response objects

### HTTP Benchmark

- **req/sec**: Requests per second (higher is better)
- **Latency**: Average response time in milliseconds (lower is better)
- **Throughput**: Data transferred per second (higher is better)
- Real-world performance under load with actual HTTP connections

## 🎯 Expected Performance

EmberAPI is designed to be **blazing fast** with:

- **Pre-compiled routes** - No regex compilation on hot path
- **Radix tree routing** - O(log n) route matching
- **Minimal overhead** - Separated contexts reduce memory allocations
- **Native Web APIs** - Uses standard Request/Response where possible

## 📝 Notes

- Run benchmarks multiple times for consistent results
- Close other applications to reduce system noise
- Use `--expose-gc` flag for more accurate memory benchmarks:
  ```bash
  node --expose-gc benchmarks/framework-benchmark.js
  ```

## 🔬 Benchmark Configuration

### Router Benchmark
- Iterations: 1,000,000
- Warmup: 10,000 iterations
- Routes: 20 test routes

### Framework Benchmark
- Iterations: 100,000
- Warmup: 1,000 iterations
- Routes: 4 test routes

### HTTP Benchmark (autocannon)
- Duration: 10 seconds
- Connections: 100
- Pipelining: 10

## 🤝 Contributing

Want to add more benchmarks? Feel free to:
- Add new test scenarios
- Compare against other frameworks
- Optimize existing benchmarks
- Add visualization tools

## 📄 License

MIT
