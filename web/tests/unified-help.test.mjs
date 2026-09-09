import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "vitest";
import { unifiedHelpDescriptor } from "../src/shell/shellBridge.ts";

test("所有页面共用完整的操作说明", () => {
  assert.deepEqual(unifiedHelpDescriptor(), {
    title: "操作说明",
    sections: [
      {
        title: "游戏",
        lines: [
          "WASD / 方向键：控制移动",
          "Ctrl+Z：撤销（自由探索）",
          "Ctrl+Y：重做（自由探索）",
          "+ / -：缩放地图",
          "滚轮：缩放地图",
          "按住滚轮拖动：平移地图",
          "Tab：切换录制面板（自由探索）",
          "~：切换 Debug（自由探索）",
        ],
      },
      {
        title: "Editor",
        lines: [
          "Tab：切换 Palette / Surface",
          "1：选择",
          "2：画笔",
          "3：Surface 智能填充",
          "4：Palette 删除工具",
          "Ctrl+A：全选地图",
          "Ctrl+Z：撤销",
          "Ctrl+Y：重做",
          "Ctrl+C / X / V：复制 / 剪切 / 粘贴",
          "Delete / Backspace：删除选中的 Entity",
          "Escape：关闭右键菜单",
          "Q / E：切换 Palette Entity 形态",
          "Surface 右键：取样当前 Terrain / Variant",
          "滚轮：缩放地图",
          "按住滚轮拖动：平移地图",
          "双指：缩放地图",
        ],
      },
    ],
  });
});

test("页面配置不维护完整快捷键清单", async () => {
  const pageSources = await Promise.all([
    "../src/app/pageChrome.ts",
    "../src/pages/editor/editorShell.ts",
    "../src/pages/game/mountGamePage.ts",
  ].map((path) => readFile(new URL(path, import.meta.url), "utf8")));
  const source = pageSources.join("\n");

  assert.doesNotMatch(source, /BROWSE_HELP|GAME_HELP|EDITOR_HELP/);
  assert.doesNotMatch(source, /录制 Replay 测试输入（Tab）/);
  assert.doesNotMatch(source, /方向键 \/ WASD 移动/);
  assert.doesNotMatch(source, /title: "(?:选择|画笔|填充|删除) \([1-4]\)"/);
});
