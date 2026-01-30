// @ts-check
const esbuild = require('esbuild');

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

async function main () {
  const ctx = await esbuild.context({
    entryPoints: ['./src/extension.ts'],
    bundle: true,
    outfile: './dist/extension.js',
    platform: 'node',
    format: 'cjs',
    external: ['vscode'],
    sourcemap: production ? 'external' : true,
    minify: production,
    drop: production ? ['console', 'debugger'] : [],
    logLevel: 'info',
  });

  if (watch) {
    console.log('Watching for changes...');
    await ctx.watch();
  } else {
    await ctx.rebuild();
    await ctx.dispose();
    console.log(production ? 'Production build complete!' : 'Build complete!');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
