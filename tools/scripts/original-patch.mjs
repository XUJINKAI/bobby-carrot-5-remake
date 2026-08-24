import fs from 'node:fs';import path from 'node:path';import {root,run,tscCommand} from './util.mjs';
run(tscCommand(),['-b','model','dat','--force']);
if(!fs.existsSync(path.join(root,'assets/generated/catalog.json'))){run(process.execPath,['tools/src/extract-jars.mjs']);run(process.execPath,['tools/src/decode-levels.mjs']);run(process.execPath,['tools/src/build-assets.mjs']);}
await import('../src/patch-original-jar.mjs');
