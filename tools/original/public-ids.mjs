const CAMPAIGN_ORDER = [
  "1",
  "2",
  "3",
  "bonus-1",
  "4",
  "5",
  "6",
  "bonus-2",
  "7",
  "8",
  "9",
  "10",
];

const SPECIAL_SCENES = [
  "beaver-shop",
  "cloud-9",
  "dream-machine",
  "dreamland-reward",
  "campaign-intro",
];

export function campaignLevelId(chapter, sourceLevelIndex) {
  const suffix = CAMPAIGN_ORDER[sourceLevelIndex - 1];
  if (!suffix) throw new Error(`无效的 Campaign source level：${sourceLevelIndex}`);
  return `${chapter}-${suffix}`;
}

export function campaignSequenceForChapter(chapter) {
  return CAMPAIGN_ORDER.map((suffix) => `${chapter}-${suffix}`);
}

export function specialSceneIdForSource(sourceLevelIndex) {
  const id = SPECIAL_SCENES[sourceLevelIndex - 1];
  if (!id) throw new Error(`无效的 Special Scene source level：${sourceLevelIndex}`);
  return id;
}
