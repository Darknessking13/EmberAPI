/**
 * 🔥 Framework Benchmark: EmberAPI vs Express vs Fastify
 * 
 * Compares the full framework performance using autocannon for HTTP load testing.
 * Tests realistic scenarios with actual HTTP requests.
 */

import { spawn, type ChildProcess } from 'child_process';
import { setTimeout as sleep } from 'timers/promises';

interface BenchmarkResult {
    framework: string;
    requestsPerSecond: number;
    latencyAvg: number;
    latencyP99: number;
    throughput: number;
}

const PORT = 3100;
const DURATION = 10; // seconds
const CONNECTIONS = 100;

/**
 * Run autocannon benchmark
 */
async function runAutocannon(url: string): Promise<any> {
    return new Promise((resolve, reject) => {
        const args = [
            url,
            '-c', CONNECTIONS.toString(),
            '-d', DURATION.toString(),
            '-j', // JSON output
        ];

        const proc = spawn('npx', ['autocannon', ...args], {
            stdio: ['ignore', 'pipe', 'pipe'],
            shell: true,
        });

        let output = '';
        let errorOutput = '';

        proc.stdout?.on('data', (data) => {
            output += data.toString();
        });

        proc.stderr?.on('data', (data) => {
            errorOutput += data.toString();
        });

        proc.on('close', (code) => {
            if (code === 0) {
                try {
                    const result = JSON.parse(output);
                    resolve(result);
                } catch (e) {
                    reject(new Error(`Failed to parse autocannon output: ${e}`));
                }
            } else {
                reject(new Error(`Autocannon failed with code ${code}: ${errorOutput}`));
            }
        });

        // Add timeout for autocannon (DURATION + 15 seconds buffer)
        const timeout = setTimeout(() => {
            proc.kill('SIGTERM');
            setTimeout(() => proc.kill('SIGKILL'), 1000);
            reject(new Error(`Autocannon timed out after ${DURATION + 15} seconds`));
        }, (DURATION + 15) * 1000);

        proc.on('close', () => clearTimeout(timeout));
    });
}

/**
 * Test if server is responding
 */
async function testServerConnection(url: string): Promise<boolean> {
    try {
        const response = await fetch(url);
        return response.ok;
    } catch {
        return false;
    }
}

/**
 * Start a server process
 */
async function startServer(scriptPath: string): Promise<ChildProcess> {
    return new Promise((resolve, reject) => {
        const proc = spawn('tsx', [scriptPath], {
            stdio: ['ignore', 'pipe', 'pipe'],
            shell: true,
        });

        let started = false;

        proc.stdout?.on('data', (data) => {
            const output = data.toString();
            console.log(`  ${output.trim()}`);

            if (!started && (output.includes('listening') || output.includes('launched') || output.includes('started'))) {
                started = true;
                resolve(proc);
            }
        });

        proc.stderr?.on('data', (data) => {
            console.error(`  Error: ${data.toString().trim()}`);
        });

        proc.on('error', reject);

        // Timeout after 10 seconds
        setTimeout(() => {
            if (!started) {
                proc.kill();
                reject(new Error('Server failed to start within 10 seconds'));
            }
        }, 10000);
    });
}

/**
 * Stop a server process
 */
async function stopServer(proc: ChildProcess): Promise<void> {
    return new Promise((resolve) => {
        proc.on('close', () => resolve());
        proc.kill('SIGTERM');

        // Force kill after 2 seconds
        setTimeout(() => {
            if (!proc.killed) {
                proc.kill('SIGKILL');
            }
        }, 2000);
    });
}

/**
 * Benchmark a framework
 */
async function benchmarkFramework(name: string, scriptPath: string): Promise<BenchmarkResult> {
    console.log(`\n🔥 Benchmarking ${name}...`);
    console.log(`  Starting server...`);

    const proc = await startServer(scriptPath);

    // Wait for server to be fully ready
    await sleep(2000);

    // Test server connectivity
    const testUrl = `http://localhost:${PORT}/users/123?filter=active&sort=name&limit=10`;
    console.log(`  Testing server connectivity...`);
    const isConnected = await testServerConnection(testUrl);

    if (!isConnected) {
        await stopServer(proc);
        throw new Error(`Server is not responding at ${testUrl}`);
    }

    console.log(`  ✅ Server is responding`);
    console.log(`  Running load test (${DURATION}s, ${CONNECTIONS} connections)...`);

    try {
        const result = await runAutocannon(testUrl);

        await stopServer(proc);

        const benchResult: BenchmarkResult = {
            framework: name,
            requestsPerSecond: result.requests.average,
            latencyAvg: result.latency.mean,
            latencyP99: result.latency.p99,
            throughput: result.throughput.average,
        };

        console.log(`  ✅ Complete`);
        console.log(`     Requests/sec: ${benchResult.requestsPerSecond.toLocaleString('en-US', { maximumFractionDigits: 0 })}`);
        console.log(`     Latency (avg): ${benchResult.latencyAvg.toFixed(2)}ms`);
        console.log(`     Latency (p99): ${benchResult.latencyP99.toFixed(2)}ms`);
        console.log(`     Throughput: ${(benchResult.throughput / 1024 / 1024).toFixed(2)} MB/s`);

        return benchResult;
    } catch (error) {
        await stopServer(proc);
        throw error;
    }
}

/**
 * Run all benchmarks
 */
async function runBenchmarks() {
    console.log('🔥🔥🔥 Framework Benchmark Suite 🔥🔥🔥\n');
    console.log(`Duration: ${DURATION}s per framework`);
    console.log(`Connections: ${CONNECTIONS}`);
    console.log(`Port: ${PORT}`);
    console.log('='.repeat(60));

    const results: BenchmarkResult[] = [];

    try {
        // Benchmark EmberAPI
        results.push(await benchmarkFramework('EmberAPI', './servers/emberapi-server.ts'));
        await sleep(2000);

        // Benchmark Fastify
        results.push(await benchmarkFramework('Fastify', './servers/fastify-server.ts'));
        await sleep(2000);

        // Benchmark Express
        results.push(await benchmarkFramework('Express', './servers/express-server.ts'));

        // Print comparison
        console.log('\n' + '='.repeat(60));
        console.log('\n📊 Comparison\n');

        // Sort by requests per second
        results.sort((a, b) => b.requestsPerSecond - a.requestsPerSecond);

        console.log('Requests per Second:');
        results.forEach((r, i) => {
            const icon = i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉';
            const percent = i === 0 ? '100%' : `${((r.requestsPerSecond / results[0].requestsPerSecond) * 100).toFixed(1)}%`;
            console.log(`  ${icon} ${r.framework.padEnd(15)} ${r.requestsPerSecond.toLocaleString('en-US', { maximumFractionDigits: 0 }).padStart(10)} req/s (${percent})`);
        });

        // Sort by latency (lower is better)
        const latencyResults = [...results].sort((a, b) => a.latencyAvg - b.latencyAvg);
        console.log('\nAverage Latency:');
        latencyResults.forEach((r, i) => {
            const icon = i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉';
            console.log(`  ${icon} ${r.framework.padEnd(15)} ${r.latencyAvg.toFixed(2).padStart(8)} ms`);
        });

        // Sort by throughput
        const throughputResults = [...results].sort((a, b) => b.throughput - a.throughput);
        console.log('\nThroughput:');
        throughputResults.forEach((r, i) => {
            const icon = i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉';
            console.log(`  ${icon} ${r.framework.padEnd(15)} ${(r.throughput / 1024 / 1024).toFixed(2).padStart(8)} MB/s`);
        });

        console.log('\n' + '='.repeat(60));
        console.log('\n🔥 Framework benchmark complete!\n');

    } catch (error) {
        console.error('\n❌ Benchmark failed:', error);
        process.exit(1);
    }
}

// Run the benchmarks
runBenchmarks().catch(console.error);
