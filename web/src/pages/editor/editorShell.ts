import {
  EDITOR_HELP,
  globalActions,
  pageIdentity,
} from "../../app/pageChrome.js";
import {
  configureShell,
  type ShellConfig,
} from "../../shell/shellBridge.js";

export function configureEditorShell(playing: boolean): void {
  configureShell(editorShellConfig(playing), EDITOR_HELP);
}

export function editorShellConfig(playing: boolean): ShellConfig {
  return {
    topBar: {
      visible: true,
      fixed: true,
      identity: pageIdentity("编辑器模式", "/edit"),
      commands: playing
        ? [
            { id: "editor-play", icon: "stop", title: "Stop Play Test" },
            {
              id: "editor-restart",
              icon: "restart",
              title: "Restart Play Test",
            },
          ]
        : [
            { id: "editor-undo", icon: "undo", title: "Undo" },
            { id: "editor-redo", icon: "redo", title: "Redo" },
            { id: "editor-play", icon: "play", title: "Play Test" },
          ],
      actions: [
        {
          id: "editor-share",
          icon: "share",
          label: "分享",
          title: "地图数据交换与分享",
          collapse: "overflow",
        },
        ...globalActions(),
      ],
    },
    bottomBar: {
      visible: true,
      fixed: true,
      leading: [{ id: "editor-palette", icon: "palette", label: "Palette" }],
      info: [{ text: "左键放置 · 右键 / Del 删除 · Q / E 切换形态" }],
      trailing: [
        { id: "editor-inspector", icon: "inspector", label: "Inspector" },
        { id: "editor-level-info", icon: "info", label: "Level" },
      ],
    },
  };
}
