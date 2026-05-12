import esbuild from 'esbuild';
import { copyFile } from 'node:fs/promises';

await esbuild.build({
  entryPoints: ['frontend/App.jsx'],
  bundle: true,
  outfile: 'public/bundle.js',
  jsx: 'transform',
  jsxFactory: 'React.createElement',
  jsxFragment: 'React.Fragment',
  format: 'iife',
  logLevel: 'info',
});

await copyFile('frontend/styles.css', 'public/styles.css');
console.log('Build complete: public/bundle.js');
