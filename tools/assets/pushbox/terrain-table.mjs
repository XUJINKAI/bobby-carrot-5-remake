// 每张地图固定选一个主题；主题内的每类素材按格子坐标稳定选取。
// ground 填写可行走 Surface；boundary 是矩形外框，obstacle 是内部阻挡。
// boundary 与 obstacle 都填写不可行走 Surface。
// 单一形态可写 Surface 名称；多形态填写 ts-行-列。
// grass、snow、sand 等顶层键仅帮助辨认主题，随机选材不读取键名。
export const PUSHBOX_TERRAIN_SEED = "pushbox-terrain-v1";

export const PUSHBOX_TERRAIN_TABLE = {
  "grass": {
    ground: ["ts-6-15", "ts-10-1", "ts-10-2"],
    boundary: ["ts-2-5", "ts-2-6"],
    obstacle: ["stump"],
  },
  "snow": {
    ground: ["ts-7-15", "ts-7-16", "ts-8-13", "ts-8-15", "ts-8-16", "ts-9-15"],
    boundary: ["snowy-rock"],
    obstacle: ["snowy-rock"],
  },
  "sand": {
    ground: ["sand"],
    boundary: ["ts-4-15", "ts-5-15"],
    obstacle: ["ts-4-15", "ts-5-15"],
  },
};
