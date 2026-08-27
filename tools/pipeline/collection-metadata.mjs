const WATER = new Set([
  "water",
  "water-animated",
  "water-variant-1",
  "water-variant-2",
  "water-variant-3",
  "tide",
]);
const GROUND = new Set([
  "ground-a",
  "ground-b",
  "ground-c",
  "ground-d",
  "start",
  "shovel-cleared-ground",
]);

const MECHANICS = [
  ["tide", (type) => type === "tide" || type === "tide-switch"],
  ["speed", (type) => type === "speed" || type === "speed-switch"],
  [
    "carousel",
    (type) => type === "carousel" || type === "carousel-switch",
  ],
  [
    "wind",
    (type) =>
      type === "wind-switch" ||
      type.startsWith("windmill-") ||
      type.startsWith("cloud-"),
  ],
  ["mirror", (type) => type === "mirror"],
  ["trap", (type) => type === "trap"],
  [
    "color-switch",
    (type) =>
      type === "color-yellow-switch" ||
      type === "color-pink-switch" ||
      type === "color-yellow-block" ||
      type === "color-pink-block",
  ],
  [
    "mower",
    (type) =>
      type === "mower" ||
      type === "gas" ||
      type === "mower-parking" ||
      type === "high-grass" ||
      type === "high-grass-objective",
  ],
  [
    "beanstalk",
    (type) =>
      type === "bean" ||
      type === "bean-field" ||
      type.startsWith("beanstalk-"),
  ],
  ["dragon", (type) => type === "dragon"],
  ["beaver", (type) => type === "beaver" || type === "lock"],
  ["dream", (type) => type === "sandman" || type === "dream-machine"],
  ["plank", (type) => type === "plank"],
  [
    "whirlwind",
    (type) => type === "whirlwind" || type === "kite" || type === "landing",
  ],
  ["ice-block", (type) => type === "ice-block"],
];

export function levelFeatures(level) {
  const entityTypes = level.entities.map((entity) => entity.type);
  const entitySet = new Set(entityTypes);

  const explicitCarrots = entityTypes.filter((type) => type === "carrot").length;
  const hiddenObjectives = entityTypes.filter(
    (type) => type === "high-grass-objective",
  ).length;
  const carrotCount =
    explicitCarrots > 0 ? explicitCarrots + hiddenObjectives : 0;

  const specialItems = [];
  if (entitySet.has("shovel-pickup")) specialItems.push("shovel");
  if (entitySet.has("mower") || entitySet.has("mower-parking"))
    specialItems.push("mower");
  if (entitySet.has("gas")) specialItems.push("gas");
  if (entitySet.has("bean")) specialItems.push("bean");
  if (entitySet.has("kite")) specialItems.push("kite");
  if (entitySet.has("golden-carrot")) specialItems.push("golden-carrot");
  if (entitySet.has("bonus-coin")) specialItems.push("bonus-coin");

  const scenes = [];
  if (
    entityTypes.some(
      (type) => GROUND.has(type) || type.startsWith("walkable-variant-"),
    )
  )
    scenes.push("grassland");
  if (entityTypes.some((type) => WATER.has(type))) scenes.push("water");
  if (entitySet.has("snow")) scenes.push("snow");
  if (entitySet.has("ice") || entitySet.has("ice-block")) scenes.push("ice");
  if (entitySet.has("high-grass") || entitySet.has("high-grass-objective"))
    scenes.push("high-grass");
  if (entityTypes.some((type) => type.startsWith("shop-"))) scenes.push("shop");

  const mechanics = new Set();
  for (const [id, matches] of MECHANICS)
    if (entityTypes.some(matches)) mechanics.add(id);

  return { carrotCount, specialItems, scenes, mechanics: [...mechanics] };
}
