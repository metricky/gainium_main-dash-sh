#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '..');
const devDistPath = path.join(projectRoot, 'dev-dist');
const distPath = path.join(projectRoot, 'dist');

// Ensure dev-dist directory exists
if (!fs.existsSync(devDistPath)) {
  fs.mkdirSync(devDistPath, { recursive: true });
  console.log('Created dev-dist directory');
}

// Copy service worker files from dist to dev-dist if they exist
const filesToCopy = ['sw.js', 'manifest.json', 'manifest.webmanifest'];

filesToCopy.forEach(filename => {
  const srcPath = path.join(distPath, filename);
  const destPath = path.join(devDistPath, filename);
  
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`Copied ${filename} to dev-dist`);
  }
});

// Copy workbox files
if (fs.existsSync(distPath)) {
  const files = fs.readdirSync(distPath);
  const workboxFiles = files.filter(file => file.startsWith('workbox-') && file.endsWith('.js'));
  
  workboxFiles.forEach(filename => {
    const srcPath = path.join(distPath, filename);
    const destPath = path.join(devDistPath, filename);
    fs.copyFileSync(srcPath, destPath);
    console.log(`Copied ${filename} to dev-dist`);
  });
}

console.log('Service worker setup completed');
