#!/usr/bin/env node
// Helperscript to convert SVG icons to React components
/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const svgDir = path.resolve(__dirname, '../public/icons');
const outDir = path.resolve(__dirname, '../src/components/icons');

if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
}

const files = fs.readdirSync(svgDir).filter((f) => f.endsWith('.svg'));

files.forEach((svgFile) => {
    const svgPath = path.join(svgDir, svgFile);
    execFileSync('npx', ['@svgr/cli', '--typescript', '--icon', '--out-dir', outDir, svgPath], { stdio: 'inherit' });
});

console.log(`Converted ${files.length} SVGs to React components in ${outDir}`);
