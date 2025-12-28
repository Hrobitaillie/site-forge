import { resolve } from 'path';
import { readdirSync, existsSync } from 'fs';
import { build } from 'vite';

/**
 * Scanne le dossier des blocs et retourne la liste des blocs avec fichiers React
 */
export function scanBlocks(blocksDir = 'src/blocks', entryFile = 'index.jsx') {
  const absoluteBlocksDir = resolve(process.cwd(), blocksDir);
  const blocks = [];

  if (existsSync(absoluteBlocksDir)) {
    const blockFolders = readdirSync(absoluteBlocksDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    for (const blockName of blockFolders) {
      const entryPath = resolve(absoluteBlocksDir, blockName, entryFile);

      if (existsSync(entryPath)) {
        blocks.push({
          name: blockName,
          entry: entryPath,
        });
      }
    }
  }

  return blocks;
}

/**
 * Plugin Vite pour afficher les blocs React trouvés (informatif seulement)
 * Le build réel des blocs se fait via le script npm
 */
export function siteforgeBlocksPlugin(options = {}) {
  const {
    blocksDir = 'src/blocks',
    entryFile = 'index.jsx',
  } = options;

  return {
    name: 'siteforge-blocks',

    buildStart() {
      const blocks = scanBlocks(blocksDir, entryFile);

      if (blocks.length === 0) {
        console.log('  [siteforge-blocks] Aucun bloc React trouvé');
        return;
      }

      console.log(`  [siteforge-blocks] ${blocks.length} bloc(s) React détectés:`);
      blocks.forEach(block => {
        console.log(`    - ${block.name}`);
      });
      console.log('  [siteforge-blocks] Utilisez "npm run build:blocks" pour les builder');
    },
  };
}

export default siteforgeBlocksPlugin;