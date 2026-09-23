/**
 * 第五代正式发行线：Base（Forever）+ UP1~UP9。
 *
 * 发行包只描述原版档案来源。关卡、代码和运行时资产各自记录 provenance，
 * 不能把某一个发行包当作其它内容的隐式“主版本”。
 */
export const RELEASES = [
  {
    id: "base",
    order: 0,
    label: "Forever",
    中文名: "永恒之夜",
    jar: "base.jar",
  },
  ...Array.from({ length: 9 }, (_, index) => {
    const n = index + 1;
    return {
      id: `up${String(n).padStart(2, "0")}`,
      order: n,
      label: `UP ${n}`,
      中文名: `进阶${n}`,
      jar: `up${String(n).padStart(2, "0")}.jar`,
    };
  }),
];

export const DAT_FILES = ["00", "01", "02", "03", "04"];
export const SOURCE_TILE_SIZE = 48;

/**
 * 运行时官方美术资产来源。
 *
 * 证据见 docs/reference/official-release-provenance.md：24 个普通 PNG 在十包字节一致；
 * title.png 有两个版本，产品明确采用 Forever/Base 版。
 */
export const OFFICIAL_RUNTIME_ASSET_SOURCES = {
  artwork: {
    defaultRelease: "base",
    extension: ".png",
    overrides: {
      "title.png": "base",
    },
  },
};
