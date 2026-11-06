// Builds every app in apps/ and assembles the site in dist/:
//   dist/index.html          landing page (from site/)
//   dist/<app-folder>/...    each app's own build output
//
// An app is served at /<its folder name>/, so its Vite `base` must be
// './' (works anywhere) or '/<folder name>/'.
import { execSync } from 'node:child_process';
import { cpSync, existsSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const appsDir = join(root, 'apps');
const out = join(root, 'dist');

// Build only the apps named on the command line, or all of them.
const only = process.argv.slice(2);
const apps = readdirSync(appsDir, { withFileTypes: true })
  .filter((d) => d.isDirectory() && existsSync(join(appsDir, d.name, 'package.json')))
  .map((d) => d.name)
  .filter((name) => only.length === 0 || only.includes(name));

rmSync(out, { recursive: true, force: true });
cpSync(join(root, 'site'), out, { recursive: true });

for (const app of apps) {
  const dir = join(appsDir, app);
  console.log(`\n▸ Building ${app}`);
  execSync('npm run build', { cwd: dir, stdio: 'inherit' });
  cpSync(join(dir, 'dist'), join(out, app), { recursive: true });
}

console.log(`\n✓ Built ${apps.length} app(s) into dist/: ${apps.join(', ')}`);
