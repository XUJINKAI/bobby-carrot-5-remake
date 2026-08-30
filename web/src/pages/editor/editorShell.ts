import type { EditorTool, LevelValidationIssue } from "@bobby/editor";
import { EDITOR_HELP, globalActions, pageIdentity } from "../../app/pageChrome.js";
import { configureShell, type ShellConfig } from "../../shell/shellBridge.js";

export function configureEditorShell(
  playing: boolean,
  tool: EditorTool = "place",
  issues: readonly LevelValidationIssue[] = [],
): void {
  configureShell(editorShellConfig(playing, tool, issues), EDITOR_HELP);
}

export function editorShellConfig(
  playing: boolean,
  tool: EditorTool = "place",
  issues: readonly LevelValidationIssue[] = [],
): ShellConfig {
  return {
    topBar: {
      visible: true,
      fixed: true,
      identity: pageIdentity("编辑器模式", "/edit"),
      commands: playing
        ? [
            { id: "editor-play", icon: "stop", title: "Stop Play Test" },
            { id: "editor-restart", icon: "restart", title: "Restart Play Test" },
          ]
        : [
            { id: "editor-tool-select", icon: "select", title: "选择 (1)", pressed: tool === "select" },
            { id: "editor-tool-place", icon: "place", title: "放置 (2)", pressed: tool === "place" },
            { id: "editor-tool-erase", icon: "erase", title: "橡皮擦 (3)", pressed: tool === "erase" },
            { id: "editor-undo", icon: "undo", title: "Undo", separatorBefore: true },
            { id: "editor-redo", icon: "redo", title: "Redo" },
            { id: "editor-play", icon: "play", title: "Play Test", separatorBefore: true },
          ],
      actions: [
        { id: "editor-share", icon: "share", label: "分享", title: "地图数据交换与分享", collapse: "overflow" },
        ...globalActions(),
      ],
    },
    bottomBar: {
      visible: true,
      fixed: true,
      leading: [{ id: "editor-palette", icon: "palette", label: "Palette" }],
      info: shellIssueInfo(issues),
      trailing: [
        { id: "editor-inspector", icon: "inspector", label: "Inspector" },
        { id: "editor-level-info", icon: "info", label: "Level" },
      ],
    },
  };
}

function shellIssueInfo(issues: readonly LevelValidationIssue[]) {
  if (issues.length === 0) return [];
  const issue = issues.find((candidate) => candidate.level === "error") ?? issues[0]!;
  const prefix = issue.level === "error" ? "⛔" : "⚠";
  const suffix = issues.length > 1 ? ` · 共 ${issues.length} 个问题` : "";
  return [{ text: `${prefix} ${issue.message}${suffix}` }];
}
