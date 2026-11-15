import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const exportDir = path.join(rootDir, 'export');
const distSrc = path.join(rootDir, 'dist');

if (!fs.existsSync(distSrc)) {
  console.error('Fehler: dist/ fehlt. Bitte zuerst "npm run build" ausführen.');
  process.exit(1);
}

fs.rmSync(exportDir, { recursive: true, force: true });
fs.mkdirSync(exportDir, { recursive: true });

// Copy pure static compiled SPA files into export/ (keinerlei Server oder npm nötig)
fs.cpSync(distSrc, exportDir, { recursive: true });

const deployMd = path.join(rootDir, 'DEPLOY.md');
if (fs.existsSync(deployMd)) {
  fs.copyFileSync(deployMd, path.join(exportDir, 'README.md'));
}

console.log('Statischer Export erfolgreich erstellt unter: export/');
