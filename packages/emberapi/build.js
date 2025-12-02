const esbuild = require('esbuild');
const { watch } = process.argv.includes('--watch');

const baseConfig = {
    entryPoints: ['src/index.js'],
    bundle: true,
    platform: 'node',
    target: 'node18',
    external: ['@emberapi/router'],
};

async function build() {
    try {
        // Build CommonJS
        await esbuild.build({
            ...baseConfig,
            format: 'cjs',
            outfile: 'dist/index.js',
        });

        // Build ESM
        await esbuild.build({
            ...baseConfig,
            format: 'esm',
            outfile: 'dist/index.mjs',
        });

        console.log('✅ Build complete!');
    } catch (error) {
        console.error('❌ Build failed:', error);
        process.exit(1);
    }
}

if (watch) {
    esbuild
        .context({
            ...baseConfig,
            format: 'cjs',
            outfile: 'dist/index.js',
        })
        .then((ctx) => {
            ctx.watch();
            console.log('👀 Watching for changes...');
        });
} else {
    build();
}
