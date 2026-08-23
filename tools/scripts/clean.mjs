import fs from 'node:fs';
import path from 'node:path';
import { root } from './util.mjs';
for (const target of ['dist', 'engine/dist', 'editor/dist', 'web/dist-src']) {
  fs.rmSync(path.join(root, target), { recursive: true, force: true });
}
console.log('已清理构建产物。');
