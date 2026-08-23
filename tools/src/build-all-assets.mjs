import { spawnSync } from 'node:child_process';
const steps = ['extract-jars.mjs', 'decode-levels.mjs', 'build-assets.mjs', 'build-level-filters.mjs'];
for (const step of steps) {
  const r = spawnSync(process.execPath, [`tools/src/${step}`], { stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status ?? 1);
}
