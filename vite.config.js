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
};

export default defineConfig({
  plugins: [
    react(),
    siteforgeBlocksPlugin(), // Affiche les blocs détectés
  ],

  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },

  build: {
    outDir: 'build',
    emptyOutDir: true,

    // Build de l'éditeur principal (composants partagés)
    lib: {
      entry: resolve(__dirname, 'assets/js/block-editor/index.jsx'),
      name: 'SiteForgeEditor',
      formats: ['iife'],
      fileName: () => 'js/editor.js',
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
