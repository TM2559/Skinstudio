import * as esbuild from 'esbuild';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const libDir = path.join(__dirname, 'lib');

if (fs.existsSync(libDir)) {
  fs.rmSync(libDir, { recursive: true });
}

await esbuild.build({
  entryPoints: ['src/index.js'],
  outbase: 'src',
  outdir: 'lib',
  bundle: true,
  splitting: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  packages: 'external',
  loader: { '.jsx': 'jsx' },
  jsx: 'automatic',
  absWorkingDir: __dirname,
});
