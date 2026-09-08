import { originalTileVisualGroup } from "@bobby/model";
import { DecodedObject, DecodedTerrain } from "./dat/semantic-ids.mjs";

function variants(type) {
  return originalTileVisualGroup(type).visuals.map((visual) => visual.fields.variant);
}

function directions(type) {
  return originalTileVisualGroup(type).visuals
    .map((visual) => visual.fields.direction)
    .filter((direction, index, all) => all.indexOf(direction) === index);
}

function pair(decoded, values, key) {
  if (decoded.length !== values.length)
    throw new Error(`${key} 的 DAT identity 与 Original Tile Visual 数量不一致`);
  return decoded.map((identity, index) => ({
    decoded: identity,
    [key]: values[index],
  }));
}

/**
 * decoded 原版身份与 canonical Entity 字段之间需要改名的稳定对应关系。
 * 同名直通和复合展开留在 Adapter；双向 variant/direction 不得在两侧各写一份表。
 */
export const ORIGINAL_ENTITY_CORRESPONDENCE = Object.freeze({
  carousel: Object.freeze(pair([
    DecodedTerrain.CAROUSEL_1,
    DecodedTerrain.CAROUSEL_2,
    DecodedTerrain.CAROUSEL_3,
    DecodedTerrain.CAROUSEL_4,
    DecodedTerrain.CAROUSEL_VERTICAL,
    DecodedTerrain.CAROUSEL_HORIZONTAL,
  ], variants("carousel"), "variant")),
  mirror: Object.freeze(pair([
    DecodedTerrain.MIRROR_1,
    DecodedTerrain.MIRROR_2,
    DecodedTerrain.MIRROR_3,
    DecodedTerrain.MIRROR_4,
  ], variants("mirror"), "variant")),
  fence: Object.freeze(pair([
    DecodedObject.FENCE_1,
    DecodedObject.FENCE_2,
    DecodedObject.FENCE_3,
    DecodedObject.FENCE_4,
    DecodedObject.FENCE_5,
    DecodedObject.FENCE_6,
  ], variants("fence"), "variant")),
  windSwitch: Object.freeze(
    directions("wind-switch").map((direction, channel) => ({
      channel,
      direction,
    })),
  ),
});

export function correspondenceByDecoded(group, decoded) {
  return ORIGINAL_ENTITY_CORRESPONDENCE[group].find(
    (candidate) => candidate.decoded === decoded,
  );
}

export function correspondenceByField(group, key, value) {
  return ORIGINAL_ENTITY_CORRESPONDENCE[group].find(
    (candidate) => candidate[key] === value,
  );
}
