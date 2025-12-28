#!/usr/bin/env node
/**
 * Script de build pour les blocs React SiteForge
 *
 * Build chaque bloc individuellement en format IIFE
 * compatible avec WordPress (utilise les globals wp.*)
 */

import { build } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { scanBlocks } from '../src/tooling/vite/siteforge-blocks-plugin.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');

// Dépendances WordPress externalisées
const wpExternals = [
  'react',
  'react-dom',
  'react/jsx-runtime',
  '@wordpress/i18n',
  '@wordpress/components',
  '@wordpress/block-editor',
  '@wordpress/blocks',
  '@wordpress/element',
  '@wordpress/data',
  '@wordpress/compose',
  '@wordpress/hooks',
  '@wordpress/server-side-render',
  '@wordpress/api-fetch',
  '@wordpress/icons',
];

// Globals WordPress pour le format IIFE
const wpGlobals = {
  'react': 'React',
  'react-dom': 'ReactDOM',
  'react/jsx-runtime': 'React',
  '@wordpress/i18n': 'wp.i18n',
  '@wordpress/components': 'wp.components',
  '@wordpress/block-editor': 'wp.blockEditor',
  '@wordpress/blocks': 'wp.blocks',
  '@wordpress/element': 'wp.element',
  '@wordpress/data': 'wp.data',
  '@wordpress/compose': 'wp.compose',
  '@wordpress/hooks': 'wp.hooks',
  '@wordpress/server-side-render': 'wp.serverSideRender',
  '@wordpress/api-fetch': 'wp.apiFetch',
  '@wordpress/icons': 'wp.primitives',
  '@wordpress/primitives': 'wp.primitives',
};

async function buildBlock(block) {
  console.log(`\n  Building block: ${block.name}...`);

  await build({
    configFile: false,
    root: rootDir,

    plugins: [
      react({
        jsxRuntime: 'classic', // Utilise React.createElement au lieu du nouveau JSX transform
      }),
    ],

    define: {
      'process.env.NODE_ENV': JSON.stringify('production'),
    },

    build: {
      outDir: `build/blocks/${block.name}`,
      emptyOutDir: true,
      lib: {
        entry: block.entry,
        name: `SifBlock_${block.name.replace(/-/g, '_')}`,
        formats: ['iife'],
        fileName: () => 'index.js',
      },
      rollupOptions: {
        external: wpExternals,
        output: {
          globals: wpGlobals,
          assetFileNames: 'style[extname]',
        },
      },
      minify: 'terser',
      sourcemap: true,
    },

    logLevel: 'warn',
  });

  console.log(`  ✓ ${block.name} built successfully`);
}

async function main() {
  console.log('\n[SiteForge] Building React blocks...\n');

  const blocks = scanBlocks('src/blocks', 'index.jsx');

  if (blocks.length === 0) {
    console.log('  No React blocks found.');
    return;
  }

  console.log(`  Found ${blocks.length} block(s) to build:`);
  blocks.forEach(b => console.log(`    - ${b.name}`));

  for (const block of blocks) {
    await buildBlock(block);
  }

  console.log('\n[SiteForge] All blocks built successfully!\n');
}

main().catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
});
