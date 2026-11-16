import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const exportDir = path.join(rootDir, 'export');
const docsDir = path.join(rootDir, 'docs');
const distSrc = path.join(rootDir, 'dist');

if (!fs.existsSync(distSrc)) {
  console.error('Fehler: dist/ fehlt. Bitte zuerst "npm run build" ausführen.');
  process.exit(1);
}

const deployMd = path.join(rootDir, 'DEPLOY.md');

for (const targetDir of [exportDir, docsDir]) {
  fs.rmSync(targetDir, { recursive: true, force: true });
  fs.mkdirSync(targetDir, { recursive: true });
  // Copy pure static compiled SPA files (keinerlei Server oder npm nötig)
  fs.cpSync(distSrc, targetDir, { recursive: true });
  fs.writeFileSync(path.join(targetDir, '.nojekyll'), '');
  if (fs.existsSync(deployMd)) {
    fs.copyFileSync(deployMd, path.join(targetDir, 'README.md'));
  }
}

console.log('Statischer Export erfolgreich erstellt unter: export/ und docs/');
