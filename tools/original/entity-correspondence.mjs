import { DecodedObject, DecodedTerrain } from "./dat/semantic-ids.mjs";

/**
 * decoded 原版身份与 canonical Entity 字段之间需要改名的稳定对应关系。
 * 同名直通和复合展开留在 Adapter；双向 variant/direction 不得在两侧各写一份表。
 */
export const ORIGINAL_ENTITY_CORRESPONDENCE = Object.freeze({
  carousel: Object.freeze([
    { decoded: DecodedTerrain.CAROUSEL_1, variant: "right-top" },
    { decoded: DecodedTerrain.CAROUSEL_2, variant: "left-top" },
    { decoded: DecodedTerrain.CAROUSEL_3, variant: "left-bottom" },
    { decoded: DecodedTerrain.CAROUSEL_4, variant: "right-bottom" },
    { decoded: DecodedTerrain.CAROUSEL_VERTICAL, variant: "vertical" },
    { decoded: DecodedTerrain.CAROUSEL_HORIZONTAL, variant: "horizontal" },
  ]),
  fence: Object.freeze([
    { decoded: DecodedObject.FENCE_1, variant: "ts-16-10" },
    { decoded: DecodedObject.FENCE_2, variant: "ts-16-11" },
    { decoded: DecodedObject.FENCE_3, variant: "ts-16-12" },
    { decoded: DecodedObject.FENCE_4, variant: "ts-16-13" },
    { decoded: DecodedObject.FENCE_5, variant: "ts-16-14" },
    { decoded: DecodedObject.FENCE_6, variant: "ts-16-15" },
  ]),
  windSwitch: Object.freeze([
    { channel: 0, direction: "up" },
    { channel: 1, direction: "down" },
    { channel: 2, direction: "left" },
    { channel: 3, direction: "right" },
  ]),
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
