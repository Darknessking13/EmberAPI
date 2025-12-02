/**
 * 🔥 Enhanced Framework Benchmark: EmberAPI vs Express vs Fastify
 * 
 * Features:
 * - Resource monitoring (CPU & Memory)
 * - Startup time tracking
 * - Better error handling
 * - Detailed metrics
 */

import { spawn, type ChildProcess } from 'child_process';
import { setTimeout as sleep } from 'timers/promises';
import pidusage from 'pidusage';
import chalk from 'chalk';
import { existsSync } from 'fs';
import { resolve as resolvePath } from 'path';

interface ServerConfig {
    name: string;
    file: string;
    port: number;
    readySignal: string;
}

interface BenchmarkResult {
    framework: string;
    requestsPerSecond: number;
    latencyAvg: number;
    latencyP99: number;
    throughput: number;
    errors: number;
    timeouts: number;
    startupTimeMs: number;
}

interface ResourceUsage {
    cpuReadings: number[];
    memReadings: number[];
}

const PORT = 3100;
const DURATION = 10; // seconds
const CONNECTIONS = 100;
const MONITORING_INTERVAL = 500; // ms

const servers: ServerConfig[] = [
    {
        name: 'EmberAPI',
        file: './servers/emberapi-server.ts',
        port: PORT,
        readySignal: 'EmberAPI server listening',
    },
    {
        name: 'Fastify',
        file: './servers/fastify-server.ts',
        port: PORT,
        readySignal: 'Fastify server listening',
    },
    {
        name: 'Express',
        file: './servers/express-server.ts',
        port: PORT,
        readySignal: 'Express server listening',
    },
];

/**
 * Formats bytes into MB
 */
function formatBytes(bytes: number): string {
    if (!bytes || bytes === 0) return '0.00 MB';
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
}

/**
 * Prints benchmark results and resource usage
 */
function printResults(
    serverName: string,
    benchmarkResults: BenchmarkResult | null,
    resourceResults: ResourceUsage
): void {
    const { cpuReadings = [], memReadings = [] } = resourceResults || {};

    // Calculate average and peak usage
    const avgCpu = cpuReadings.length > 0 ? cpuReadings.reduce((a, b) => a + b, 0) / cpuReadings.length : 0;
    const peakCpu = cpuReadings.length > 0 ? Math.max(...cpuReadings) : 0;
    const avgMem = memReadings.length > 0 ? memReadings.reduce((a, b) => a + b, 0) / memReadings.length : 0;
    const peakMem = memReadings.length > 0 ? Math.max(...memReadings) : 0;

    console.log(chalk.magentaBright(`\n📋 Results for ${chalk.bold(serverName)}:`));

    if (benchmarkResults) {
        console.log(`→ Startup Time:     ${chalk.cyan(benchmarkResults.startupTimeMs.toFixed(0))} ms`);
        console.log(`→ Requests/sec:     ${chalk.green(benchmarkResults.requestsPerSecond.toFixed(2))}`);
        console.log(`→ Latency (avg):    ${chalk.yellow(benchmarkResults.latencyAvg.toFixed(2))} ms`);
        console.log(`→ Latency (p99):    ${chalk.yellow(benchmarkResults.latencyP99.toFixed(2))} ms`);
        console.log(`→ Throughput (avg): ${chalk.cyan(formatBytes(benchmarkResults.throughput))}/s`);

        if (benchmarkResults.errors > 0 || benchmarkResults.timeouts > 0) {
            console.log(chalk.red(`→ Errors:           ${benchmarkResults.errors}`));
            console.log(chalk.red(`→ Timeouts:         ${benchmarkResults.timeouts}`));
        }
    } else {
        console.log(chalk.red('→ Benchmark data unavailable (error occurred).'));
    }

    console.log(chalk.magentaBright('\n🧠 Resource Usage During Benchmark:'));
    if (cpuReadings.length > 0 || memReadings.length > 0) {
        console.log(`→ Avg CPU Usage:    ${chalk.yellow(avgCpu.toFixed(2))}%`);
        console.log(`→ Peak CPU Usage:   ${chalk.red(peakCpu.toFixed(2))}%`);
        console.log(`→ Avg Memory Usage: ${chalk.yellow(formatBytes(avgMem))}`);
        console.log(`→ Peak Memory Usage:${chalk.red(formatBytes(peakMem))}`);
        console.log(chalk.dim(`  (Based on ${cpuReadings.length} samples taken every ${MONITORING_INTERVAL}ms)`));
    } else {
        console.log(chalk.yellow('  Could not collect resource usage data.'));
    }
    console.log(chalk.magentaBright(`--- End Results ---\n`));
}

/**
 * Starts a server process and waits for its ready signal
 */
function startServer(serverConfig: ServerConfig): Promise<{ process: ChildProcess; startupTimeMs: number }> {
    return new Promise((resolvePromise, reject) => {
        const startTime = process.hrtime.bigint();
        console.log(chalk.blue(`\n🚀 Starting ${serverConfig.name} server... (File: ${resolvePath(serverConfig.file)})`));

        if (!existsSync(serverConfig.file)) {
            return reject(new Error(`Server file not found: ${resolvePath(serverConfig.file)}`));
        }

        const serverProcess = spawn('tsx', [serverConfig.file], {
            stdio: ['ignore', 'pipe', 'pipe'],
            shell: true,
        });

        let output = '';
        let errorOutput = '';
        let isResolved = false;
        const pid = serverProcess.pid;

        if (pid) {
            console.log(chalk.dim(`   Spawned ${serverConfig.name} with PID: ${pid}`));
        }

        serverProcess.stdout?.on('data', (data) => {
            const chunk = data.toString();
            output += chunk;

            if (!isResolved && output.includes(serverConfig.readySignal)) {
                isResolved = true;
                const endTime = process.hrtime.bigint();
                const startupTimeMs = Number((endTime - startTime) / 1000000n);

                console.log(
                    chalk.green(`✅ ${serverConfig.name} server ready. PID: ${pid || 'N/A'}. `) +
                    chalk.dim(`(Startup Time: ${startupTimeMs.toFixed(0)} ms)`)
                );

                setTimeout(() => resolvePromise({ process: serverProcess, startupTimeMs }), 300);
            }
        });

        serverProcess.stderr?.on('data', (data) => {
            const chunk = data.toString();
            console.error(chalk.red(`[${serverConfig.name} ERR] ${chunk.trim()}`));
            errorOutput += chunk;
        });

        serverProcess.on('error', (err) => {
            if (!isResolved) {
                isResolved = true;
                reject(new Error(`Failed to spawn ${serverConfig.name}: ${err.message}`));
            }
        });

        const startupTimeout = setTimeout(() => {
            if (!isResolved) {
                isResolved = true;
                serverProcess.kill('SIGKILL');
                reject(new Error(`${serverConfig.name} failed to start within 15 seconds`));
            }
        }, 15000);

        serverProcess.on('exit', () => clearTimeout(startupTimeout));
        serverProcess.on('error', () => clearTimeout(startupTimeout));
    });
}

/**
 * Kill a process by PID (cross-platform)
 */
function killProcessByPid(pid: number, signal: NodeJS.Signals = 'SIGTERM'): boolean {
    try {
        process.kill(pid, signal);
        console.log(chalk.dim(`   Sent ${signal} to PID ${pid}`));
        return true;
    } catch (err: any) {
        if (err.code === 'ESRCH') {
            console.log(chalk.dim(`   Process ${pid} already dead`));
        } else {
            console.warn(chalk.yellow(`   Warning: Could not kill PID ${pid}: ${err.message}`));
        }
        return false;
    }
}

/**
 * Stops a server process and waits for it to exit
 */
function stopServer(serverProcess: ChildProcess, serverName: string, pid: number | undefined): Promise<void> {
    return new Promise((resolve) => {
        if (!serverProcess || serverProcess.killed) {
            resolve();
            return;
        }

        console.log(chalk.blue(`🔪 Stopping ${serverName} server (PID: ${pid})...`));

        let resolved = false;

        const onExit = () => {
            if (!resolved) {
                resolved = true;
                console.log(chalk.green(`   ✅ ${serverName} server stopped.`));
                resolve();
            }
        };

        serverProcess.once('exit', onExit);

        // Kill by PID if available (more reliable than ChildProcess.kill)
        if (pid) {
            killProcessByPid(pid, 'SIGTERM');

            // Force kill after 2 seconds
            setTimeout(() => {
                if (!resolved) {
                    console.warn(chalk.yellow(`⚠️  ${serverName} (PID: ${pid}) didn't exit. Force killing...`));
                    killProcessByPid(pid, 'SIGKILL');

                    setTimeout(() => {
                        if (!resolved) {
                            resolved = true;
                            resolve();
                        }
                    }, 500);
                }
            }, 2000);
        } else {
            // Fallback to ChildProcess.kill()
            serverProcess.kill('SIGTERM');

            setTimeout(() => {
                if (!resolved && !serverProcess.killed) {
                    serverProcess.kill('SIGKILL');
                }
                setTimeout(() => {
                    if (!resolved) {
                        resolved = true;
                        resolve();
                    }
                }, 500);
            }, 2000);
        }
    });
}

/**
 * Runs autocannon benchmark
 */
async function runAutocannon(url: string, serverName: string): Promise<any> {
    console.log(chalk.blue(`🔥 Running benchmark on ${chalk.bold(serverName)} (${url})... (Duration: ${DURATION}s)`));

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
                    console.log(chalk.blue(`📊 Benchmark finished for ${serverName}.`));
                    resolve(result);
                } catch (e) {
                    reject(new Error(`Failed to parse autocannon output: ${e}`));
                }
            } else {
                reject(new Error(`Autocannon failed with code ${code}: ${errorOutput}`));
            }
        });

        // Timeout
        const timeout = setTimeout(() => {
            proc.kill('SIGTERM');
            setTimeout(() => proc.kill('SIGKILL'), 1000);
            reject(new Error(`Autocannon timed out after ${DURATION + 15} seconds`));
        }, (DURATION + 15) * 1000);

        proc.on('close', () => clearTimeout(timeout));
    });
}

/**
 * Monitors CPU and Memory usage
 */
function monitorResources(pid: number | undefined, durationSeconds: number): Promise<ResourceUsage> {
    if (!pid) {
        console.log(chalk.yellow('⚠️  No PID available for resource monitoring'));
        return Promise.resolve({ cpuReadings: [], memReadings: [] });
    }

    console.log(chalk.blue(`🔬 Starting resource monitoring for PID ${pid}...`));

    const cpuReadings: number[] = [];
    const memReadings: number[] = [];
    let intervalId: NodeJS.Timeout;

    return new Promise((resolve) => {
        intervalId = setInterval(async () => {
            try {
                const stats = await pidusage(pid);
                cpuReadings.push(stats.cpu);
                memReadings.push(stats.memory);
            } catch (err: any) {
                if (!err.message.toLowerCase().includes("process doesn't exist")) {
                    console.warn(chalk.yellow(`Pidusage warning: ${err.message}`));
                }
            }
        }, MONITORING_INTERVAL);

        setTimeout(() => {
            clearInterval(intervalId);
            console.log(chalk.blue(`🔬 Resource monitoring stopped for PID ${pid}.`));
            resolve({ cpuReadings, memReadings });
        }, (durationSeconds * 1000) + MONITORING_INTERVAL);
    });
}

/**
 * Main benchmark execution
 */
async function runBenchmarks() {
    console.log(chalk.yellow('\n🔥🔥🔥 Enhanced Framework Benchmark Suite 🔥🔥🔥\n'));
    console.log(`Duration: ${DURATION}s per framework`);
    console.log(`Connections: ${CONNECTIONS}`);
    console.log(`Port: ${PORT}`);
    console.log('='.repeat(70));

    const allResults: BenchmarkResult[] = [];

    for (const serverConfig of servers) {
        let serverProcess: ChildProcess | null = null;
        let pid: number | undefined;
        let benchmarkResults: BenchmarkResult | null = null;
        let resourceResults: ResourceUsage = { cpuReadings: [], memReadings: [] };
        let startupTimeMs = 0;

        try {
            const { process, startupTimeMs: startup } = await startServer(serverConfig);
            serverProcess = process;
            pid = serverProcess.pid;
            startupTimeMs = startup;

            const url = `http://localhost:${serverConfig.port}/users/123`;

            // Start monitoring and benchmark simultaneously
            const monitorPromise = monitorResources(pid, DURATION);
            const autocannonResult = await runAutocannon(url, serverConfig.name);
            resourceResults = await monitorPromise;

            benchmarkResults = {
                framework: serverConfig.name,
                requestsPerSecond: autocannonResult.requests.average,
                latencyAvg: autocannonResult.latency.mean,
                latencyP99: autocannonResult.latency.p99,
                throughput: autocannonResult.throughput.average,
                errors: autocannonResult.errors || 0,
                timeouts: autocannonResult.timeouts || 0,
                startupTimeMs,
            };

            allResults.push(benchmarkResults);

        } catch (error: any) {
            console.error(chalk.red(`\n❌ Benchmark run failed for ${serverConfig.name}: ${error.message}`));
        } finally {
            // Print results
            printResults(serverConfig.name, benchmarkResults, resourceResults);

            // Cleanup - properly stop the server and wait for it to exit
            if (serverProcess) {
                await stopServer(serverProcess, serverConfig.name, pid);
            }
        }

        // Delay between servers to ensure port is fully released
        await sleep(2000);
    }

    // Print comparison
    if (allResults.length > 0) {
        console.log('\n' + '='.repeat(70));
        console.log(chalk.greenBright('\n📊 Final Comparison\n'));

        // Sort by requests per second
        const sorted = [...allResults].sort((a, b) => b.requestsPerSecond - a.requestsPerSecond);

        console.log(chalk.bold('Requests per Second:'));
        sorted.forEach((r, i) => {
            const icon = i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉';
            const percent = i === 0 ? '100%' : `${((r.requestsPerSecond / sorted[0].requestsPerSecond) * 100).toFixed(1)}%`;
            console.log(`  ${icon} ${r.framework.padEnd(15)} ${r.requestsPerSecond.toLocaleString('en-US', { maximumFractionDigits: 0 }).padStart(10)} req/s (${percent})`);
        });

        console.log('\n' + '='.repeat(70));
    }

    console.log(chalk.greenBright('\n🏁 Benchmark Suite Finished!\n'));
}

// Run the benchmarks
runBenchmarks().catch(err => {
    console.error(chalk.red('\n❌❌❌ Benchmark suite failed unexpectedly:'), err);
    process.exit(1);
});
