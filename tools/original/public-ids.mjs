const PLAY_ORDER = [1, 2, 3, 11, 4, 5, 6, 12, 7, 8, 9, 10];

const SPECIAL_SCENES = [
  "beaver-shop",
  "cloud-9",
  "dream-machine",
  "dreamland-reward",
  "campaign-intro",
];

export function campaignLevelId(chapter, sourceLevelIndex) {
  if (!Number.isInteger(chapter) || chapter < 1 || chapter > 40)
    throw new Error(`无效的 Campaign chapter：${chapter}`);
  assertSourceLevelIndex(sourceLevelIndex);
  if (sourceLevelIndex === 11) return `${chapter}-bonus-1`;
  if (sourceLevelIndex === 12) return `${chapter}-bonus-2`;
  return `${chapter}-${sourceLevelIndex}`;
}

export function campaignLevelName(sourceLevelIndex) {
  assertSourceLevelIndex(sourceLevelIndex);
  if (sourceLevelIndex > 10) return `BONUS ${sourceLevelIndex - 10}`;
  return String(sourceLevelIndex);
}

export function campaignSequenceForChapter(chapter) {
  return PLAY_ORDER.map((sourceLevelIndex) =>
    campaignLevelId(chapter, sourceLevelIndex),
  );
}

export function specialSceneIdForSource(sourceLevelIndex) {
  const id = SPECIAL_SCENES[sourceLevelIndex - 1];
  if (!id) throw new Error(`无效的 Special Scene source level：${sourceLevelIndex}`);
  return id;
}

function assertSourceLevelIndex(sourceLevelIndex) {
  if (
    !Number.isInteger(sourceLevelIndex) ||
    sourceLevelIndex < 1 ||
    sourceLevelIndex > 12
  )
    throw new Error(`无效的 Campaign source level：${sourceLevelIndex}`);
}
