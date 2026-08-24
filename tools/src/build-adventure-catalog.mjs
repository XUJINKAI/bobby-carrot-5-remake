import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { adventureLevelId, campaignSequenceForChapter, specialSceneIdForSource } from '../../adventure/dist/index.js';
import { RELEASES } from './source-definitions.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const generated = path.join(root, 'assets/generated');
const catalogPath = path.join(generated, 'catalog.json');
const sourceIndexPath = path.join(generated, 'source-index.json');

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const sourceIndex = JSON.parse(fs.readFileSync(sourceIndexPath, 'utf8'));
const releaseOrder = new Map(RELEASES.map((release) => [release.id, release.order]));
const specialLabels = {
  'beaver-shop': 'Beaver Shop',
  'cloud-9': 'Cloud 9',
  'dream-machine': 'Dream Machine',
  'dreamland-reward': 'Dreamland Reward',
  'campaign-intro': 'Adventure Welcome'
};

const campaignLevels = [];
const specialScenes = [];
const levelByPublicId = new Map();

for (const item of catalog.levels) {
  const source = item.primarySource ?? item.sources?.[0];
  if (!source) throw new Error(`Canonical map ${item.id} has no source`);
  const order = releaseOrder.get(item.releaseSourceId ?? source.release);
  if (order === undefined) throw new Error(`Unknown source release for ${item.id}`);
  const sourceLevelIndex = Number(source.levelIndex);
  const levelFile = path.join(generated, item.path);
  const level = JSON.parse(fs.readFileSync(levelFile, 'utf8'));

  if (String(source.packFile) === '00') {
    const sceneId = specialSceneIdForSource(sourceLevelIndex);
    const scene = {id:sceneId,publicId:sceneId,contentKind:'special-scene',canonicalId:item.canonicalId,sourceLevelIndex,label:specialLabels[sceneId]??sceneId,path:item.path,primarySource:source,sources:item.sources};
    specialScenes.push(scene);
    Object.assign(level,{publicId:sceneId,contentKind:'special-scene',specialSceneId:sceneId,sourceLevelIndex});
    delete level.chapter;delete level.chapterLevel;delete level.chapterTitle;
    fs.writeFileSync(levelFile,`${JSON.stringify(level,null,2)}\n`);
    continue;
  }

  const chapter = sourceChapterNumber(order, source.packFile);
  const publicId = adventureLevelId(chapter, sourceLevelIndex);
  const bonusOrdinal = sourceLevelIndex===11?1:sourceLevelIndex===12?2:null;
  const normalized={...item,publicId,contentKind:bonusOrdinal===null?'level':'bonus',chapter,chapterLevel:sourceLevelIndex,sourceLevelIndex,bonusOrdinal};
  campaignLevels.push(normalized);levelByPublicId.set(publicId,normalized);
  Object.assign(level,{publicId,contentKind:normalized.contentKind,chapter,chapterLevel:sourceLevelIndex,sourceLevelIndex,bonusOrdinal});
  fs.writeFileSync(levelFile,`${JSON.stringify(level,null,2)}\n`);
}

if(campaignLevels.length!==480)throw new Error(`Expected 480 campaign maps, got ${campaignLevels.length}`);
if(specialScenes.length!==5)throw new Error(`Expected 5 shared special scenes, got ${specialScenes.length}`);

const chapters=[];
for(const release of sourceIndex.releases){const order=releaseOrder.get(release.id);if(order===undefined)throw new Error(`Unknown source release ${release.id}`);for(const pack of release.packs){if(String(pack.packFile)==='00')continue;if(![1,2,3].includes(pack.packType))throw new Error(`Original chapter ${release.id}/${pack.packFile} has invalid packType ${String(pack.packType)}`);const number=sourceChapterNumber(order,pack.packFile),levelPublicIds=campaignSequenceForChapter(number);for(const publicId of levelPublicIds)if(!levelByPublicId.has(publicId))throw new Error(`Campaign chapter ${number} references missing ${publicId}`);chapters.push({id:String(number),number,title:pack.title,description:pack.description,difficultyStars:pack.packType,levelPublicIds,source:{release:release.id,releaseLabel:release.label,packFile:pack.packFile,packType:pack.packType}});}}
chapters.sort((a,b)=>a.number-b.number);if(chapters.length!==40||chapters[0]?.number!==1||chapters.at(-1)?.number!==40)throw new Error('Adventure catalog must contain chapters 1..40');

const sourceReleases=catalog.releases;
const upgraded={...catalog,schemaVersion:4,idScheme:{public:'<chapter>-<level> or <chapter>-bonus-<1|2>',examples:['1-1','1-bonus-1','40-10'],specialScenes:specialScenes.map((scene)=>scene.id),canonical:'001...485 (archive-only dedup identity)'},uniqueMaps:485,uniqueLevels:480,specialSceneCount:5,sourceReleases,chapters,specialScenes,levels:campaignLevels,campaign:{chapterCount:40,mainLevelsPerChapter:10,bonusLevelsPerChapter:2,levelCount:480,specialSceneCount:5,order:'1,2,3,bonus-1,4,5,6,bonus-2,7,8,9,10'}};
delete upgraded.releases;
fs.writeFileSync(catalogPath,`${JSON.stringify(upgraded,null,2)}\n`);
console.log('构建 Adventure Catalog：40 章 / 480 关 / 5 个特殊场景；章节难度直接使用原版 DAT packType 1~3 星。');

function sourceChapterNumber(order,packFile){const local=Number(packFile);if(!Number.isInteger(order)||order<0||!Number.isInteger(local)||local<1||local>4)throw new Error(`Invalid archive chapter source: releaseOrder=${order}, packFile=${String(packFile)}`);const chapter=order*4+local;if(chapter<1||chapter>40)throw new Error(`Archive chapter maps outside Adventure 1..40: ${chapter}`);return chapter;}
