import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { siteforgeBlocksPlugin } from './src/tooling/vite/siteforge-blocks-plugin.js';

// Dépendances WordPress externalisées
const wpExternals = [
  'react',
  'react-dom',
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
  '@wordpress/notices',
];

// Globals WordPress pour le format IIFE
const wpGlobals = {
  'react': 'React',
  'react-dom': 'ReactDOM',
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
  '@wordpress/icons': 'wp.icons',
  '@wordpress/notices': 'wp.notices',
};

// Get build target from environment variable or default to 'editor'
const buildTarget = process.env.BUILD_TARGET || 'editor';

// Entry points configuration
const entryPoints = {
  editor: {
    entry: resolve(__dirname, 'assets/js/block-editor/index.jsx'),
    name: 'SiteForgeEditor',
    fileName: 'js/editor.js',
  },
  'design-system': {
    entry: resolve(__dirname, 'assets/js/admin/design-system/index.jsx'),
    name: 'SiteForgeDesignSystem',
    fileName: 'js/design-system.js',
  },
};

const currentEntry = entryPoints[buildTarget];

export default defineConfig({
  plugins: [
    react(),
    buildTarget === 'editor' ? siteforgeBlocksPlugin() : null,
  ].filter(Boolean),

  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },

  build: {
    outDir: 'build',
    emptyOutDir: buildTarget === 'editor', // Only empty on first build

    lib: {
      entry: currentEntry.entry,
      name: currentEntry.name,
      formats: ['iife'],
      fileName: () => currentEntry.fileName,
    },

    rollupOptions: {
      external: wpExternals,
      output: {
        globals: wpGlobals,
        assetFileNames: 'css/[name][extname]',
      },
    },

    minify: 'terser',
    sourcemap: true,
  },

  server: {
    port: 3000,
    strictPort: false,
  },

  resolve: {
    extensions: ['.js', '.jsx', '.json', '.scss', '.css'],
  },
});
