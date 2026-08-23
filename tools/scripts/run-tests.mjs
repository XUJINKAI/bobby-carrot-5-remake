import fs from 'node:fs';
import path from 'node:path';
import { root, run, tscCommand } from './util.mjs';
if (!fs.existsSync(path.join(root, 'engine/dist/index.js'))) run(tscCommand(), ['-p', 'engine/tsconfig.json']);
if (!fs.existsSync(path.join(root, 'editor/dist/index.js'))) run(tscCommand(), ['-p', 'editor/tsconfig.json']);
run(process.execPath, ['--test', 'engine/tests/*.test.mjs', 'editor/tests/*.test.mjs'], { shell: true });
