// Boundary between Bobby Carrot 5's original DAT byte format and the project's semantic level model.
// No Engine / Editor / Web module should import or depend on these byte values.

const TERRAIN_BY_DAT = new Map([
  [0x4d, 'snow'],
  [0x55, 'water'], [0x56, 'water-animated'],
  [0x57, 'tide-up'], [0x58, 'tide-down'], [0x59, 'tide-left'], [0x5a, 'tide-right'],
  [0x5b, 'water-variant-1'], [0x5c, 'water-variant-2'], [0x5d, 'water-variant-3'],
  [0x5e, 'ground-a'], [0x5f, 'ground-b'],
  [0x7c, 'shovel-cleared-ground'],
  [0x90, 'ground-c'], [0x91, 'ground-d'], [0x94, 'ice'], [0x95, 'start'], [0x96, 'exit'],
  [0x97, 'shop-dream'], [0x98, 'shop-cloud9'], [0x99, 'shop-super-key'], [0x9a, 'shop-stereo'],
  [0x9b, 'shop-music'], [0x9c, 'shop-speed-shoes'], [0x9d, 'shop-coin-radar'], [0x9e, 'shop-unavailable'],
  [0x9f, 'shovel-pickup'], [0xa0, 'mower-parking'],
  [0xa1, 'speed-switch-pressed'], [0xa2, 'speed-switch-raised'],
  [0xa3, 'carousel-switch-raised'], [0xa4, 'carousel-switch-pressed'],
  [0xa5, 'tide-switch-raised'], [0xa6, 'tide-switch-pressed'],
  [0xa7, 'wind-switch-0-on'], [0xa8, 'wind-switch-0-off'], [0xa9, 'wind-switch-1-on'], [0xaa, 'wind-switch-1-off'],
  [0xab, 'wind-switch-2-on'], [0xac, 'wind-switch-2-off'], [0xad, 'wind-switch-3-on'], [0xae, 'wind-switch-3-off'],
  [0xaf, 'trap-active'], [0xb0, 'trap-inactive'],
  [0xb1, 'mirror-1'], [0xb2, 'mirror-2'], [0xb3, 'mirror-3'], [0xb4, 'mirror-4'],
  [0xb5, 'speed-up'], [0xb6, 'speed-down'], [0xb7, 'speed-left'], [0xb8, 'speed-right'],
  [0xb9, 'carousel-1'], [0xba, 'carousel-2'], [0xbb, 'carousel-3'], [0xbc, 'carousel-4'],
  [0xbd, 'carousel-vertical'], [0xbe, 'carousel-horizontal'],
  [0xbf, 'color-yellow-switch-raised'], [0xc0, 'color-yellow-switch-pressed'],
  [0xc1, 'color-pink-switch-raised'], [0xc2, 'color-pink-switch-pressed'],
  [0xc3, 'color-yellow-block-raised'], [0xc4, 'color-yellow-block-lowered'],
  [0xc5, 'color-pink-block-raised'], [0xc6, 'color-pink-block-lowered'],
  [0xc7, 'high-grass'], [0xc8, 'high-grass-objective']
]);

const OBJECT_BY_DAT = new Map([
  [0xc9, 'consumed-carrot'], [0xca, 'carrot'], [0xcb, 'egg-nest-empty'], [0xcc, 'egg-nest-filled'], [0xcd, 'lock'],
  [0xce, 'beanstalk-tip'], [0xcf, 'bean'], [0xd0, 'windmill-up'], [0xd1, 'windmill-down'], [0xd2, 'windmill-left'], [0xd3, 'windmill-right'],
  [0xd4, 'plank'], [0xd5, 'plank-crumbling'], [0xd6, 'plank-fragment'], [0xd7, 'dragon-head'], [0xd8, 'dragon-body'], [0xd9, 'dragon-tail'],
  [0xda, 'sandman'], [0xdb, 'dream-machine'], [0xdc, 'mower'], [0xdd, 'gas'], [0xde, 'beanstalk-mid'], [0xdf, 'bean-field'],
  [0xe0, 'cloud-red'], [0xe1, 'cloud-purple'], [0xe2, 'cloud-green'], [0xe3, 'ice-block'], [0xe4, 'ice-melt-1'], [0xe5, 'ice-melt-2'], [0xe6, 'ice-melt-3'],
  [0xe7, 'beaver-base'], [0xe8, 'dragon-anim-1'], [0xe9, 'dragon-anim-2'], [0xea, 'sandman-body'], [0xeb, 'dream-machine-body'], [0xec, 'leaf'],
  [0xed, 'crumbly-rock'], [0xee, 'beanstalk-base'], [0xef, 'bean-sprout'], [0xf0, 'cloud-grid-red'], [0xf1, 'cloud-grid-purple'], [0xf2, 'cloud-grid-green'],
  [0xf3, 'kite'], [0xf4, 'whirlwind'], [0xf5, 'landing'], [0xf6, 'golden-carrot'], [0xf7, 'beaver-body'], [0xf8, 'bonus-coin'],
  [0xf9, 'fence-1'], [0xfa, 'fence-2'], [0xfb, 'fence-3'], [0xfc, 'fence-4'], [0xfd, 'fence-5'], [0xfe, 'fence-6'], [0xff, 'empty']
]);

const DAT_BY_TERRAIN = reverse(TERRAIN_BY_DAT);
const DAT_BY_OBJECT = reverse(OBJECT_BY_DAT);

export function decodeDatTerrain(byte) {
  const code = normalizeByte(byte);
  const known = TERRAIN_BY_DAT.get(code);
  if (known) return known;
  // Preserve unknown art without leaking DAT numbers upward. The ordinal is local to a semantic category.
  if (code >= 0x60 && code <= 0x93) return `walkable-variant-${String(code - 0x60 + 1).padStart(2, '0')}`;
  return `background-variant-${String(code + 1).padStart(3, '0')}`;
}

export function encodeDatTerrain(type) {
  const known = DAT_BY_TERRAIN.get(type);
  if (known !== undefined) return known;
  const walkable = /^walkable-variant-(\d{2})$/.exec(type);
  if (walkable) return normalizeByte(0x60 + Number(walkable[1]) - 1);
  const background = /^background-variant-(\d{3})$/.exec(type);
  if (background) return normalizeByte(Number(background[1]) - 1);
  throw new Error(`No DAT terrain mapping for semantic type: ${type}`);
}

export function decodeDatObject(byte) {
  const code = normalizeByte(byte);
  return OBJECT_BY_DAT.get(code) ?? `object-variant-${String(code + 1).padStart(3, '0')}`;
}

export function encodeDatObject(type) {
  const known = DAT_BY_OBJECT.get(type);
  if (known !== undefined) return known;
  const variant = /^object-variant-(\d{3})$/.exec(type);
  if (variant) return normalizeByte(Number(variant[1]) - 1);
  throw new Error(`No DAT object mapping for semantic type: ${type}`);
}

export function decodeDatLevel(raw) {
  return {
    ...raw,
    schemaVersion: 2,
    terrainEncoding: 'semantic-row-major',
    terrain: raw.terrain.map((row) => row.map(decodeDatTerrain)),
    objects: raw.objects.map(({ id, x, y }) => ({ type: decodeDatObject(id), x, y }))
  };
}

export function encodeDatLevel(level) {
  return {
    ...level,
    terrain: level.terrain.map((row) => row.map(encodeDatTerrain)),
    objects: level.objects.map(({ type, x, y }) => ({ id: encodeDatObject(type), x, y }))
  };
}

function reverse(map) {
  return new Map(Array.from(map, ([code, type]) => [type, code]));
}

function normalizeByte(value) {
  if (!Number.isFinite(Number(value))) throw new Error(`Invalid DAT byte: ${String(value)}`);
  return Math.min(255, Math.max(0, Math.trunc(Number(value)))) & 0xff;
}
