/**
 * 第五代正式发行线：Base（Forever）+ UP1~UP9。
 *
 * 资料包里的英文普通版、中文“永恒之夜/进阶1~9”和高清版，关卡 DAT
 * 均可按发行版本一一对应。构建时只取高清版作为权威源，避免重复资产。
 */
export const RELEASES = [
  { id: 'base', order: 0, label: 'Forever', 中文名: '永恒之夜', jar: 'base.jar' },
  ...Array.from({ length: 9 }, (_, index) => {
    const n = index + 1;
    return { id: `up${String(n).padStart(2, '0')}`, order: n, label: `UP ${n}`, 中文名: `进阶${n}`, jar: `up${String(n).padStart(2, '0')}.jar` };
  })
];

export const DAT_FILES = ['00', '01', '02', '03', '04'];
export const PRIMARY_ART_RELEASE = 'up09';
export const SOURCE_TILE_SIZE = 48;
