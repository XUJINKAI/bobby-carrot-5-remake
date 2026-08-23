import fs from 'node:fs';

const path = 'engine/src/mechanics/definitions.ts';
let text = fs.readFileSync(path, 'utf8');
const from = "return {id,presentation:{name:pretty(id),category:walkable?'terrain-variant':'background-variant'},traits:[...(walkable?['walkable' as TileTrait]:[]),...(water?['water' as TileTrait]:[])],behaviors:[markerBehavior(walkable?'ordinary-walkable':'background','DAT 未命名语义变体；行为按已确认类别处理')],...(source?{source}:{})};";
const to = "return {id,presentation:{name:pretty(id),category:walkable?'terrain-variant':'background-variant'},traits:environmentTraits(id),behaviors:[markerBehavior(walkable?'ordinary-walkable':'background','DAT 未命名语义变体；行为按已确认类别处理')],...(source?{source}:{})};";
if (!text.includes(from)) throw new Error('variant definition target not found');
text = text.replace(from, to);
fs.writeFileSync(path, text);
console.log('Fixed variant environment traits.');
