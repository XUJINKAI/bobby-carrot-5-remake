import type {
  EditorTool,
  LevelValidationIssue,
  SurfaceTool,
} from "@bobby/editor";
import {
  EDITOR_HELP,
  globalActions,
  pageIdentity,
} from "../../app/pageChrome.js";
import {
  configureShell,
  type ShellAction,
  type ShellConfig,
} from "../../shell/shellBridge.js";

export interface EditorPlayShellState {
  canUndo: boolean;
  canRedo: boolean;
}

const EMPTY_PLAY_STATE: EditorPlayShellState = {
  canUndo: false,
  canRedo: false,
};

export function configureEditorShell(
  playing: boolean,
  tool: EditorTool = "select",
  issues: readonly LevelValidationIssue[] = [],
  playState: EditorPlayShellState = EMPTY_PLAY_STATE,
  leftPanel: "palette" | "surface" = "surface",
  surfaceTool: SurfaceTool = "rect",
): void {
  configureShell(
    editorShellConfig(
      playing,
      tool,
      issues,
      playState,
      leftPanel,
      surfaceTool,
    ),
    EDITOR_HELP,
  );
}

export function editorShellConfig(
  playing: boolean,
  tool: EditorTool = "select",
  issues: readonly LevelValidationIssue[] = [],
  playState: EditorPlayShellState = EMPTY_PLAY_STATE,
  leftPanel: "palette" | "surface" = "surface",
  surfaceTool: SurfaceTool = "rect",
): ShellConfig {
  const authoringCommands: ShellAction[] =
    leftPanel === "surface"
      ? [
          {
            id: "editor-surface-select",
            icon: "select",
            title: "选择 (1)",
            pressed: surfaceTool === "rect",
          },
          {
            id: "editor-surface-brush",
            icon: "edit",
            title: "画笔 (2)",
            pressed: surfaceTool === "brush",
          },
          {
            id: "editor-surface-fill",
            icon: "fill",
            title: "填充 (3)",
            pressed: surfaceTool === "fill",
          },
        ]
      : [
          {
            id: "editor-tool-select",
            icon: "select",
            title: "选择 (1)",
            pressed: tool === "select",
          },
          {
            id: "editor-tool-brush",
            icon: "edit",
            title: "画笔 (2)",
            pressed: tool === "place",
          },
          {
            id: "editor-tool-erase",
            icon: "erase",
            title: "删除 (4)",
            pressed: tool === "erase",
          },
        ];

  return {
    topBar: {
      visible: true,
      fixed: true,
      identity: pageIdentity("编辑器模式", "/edit"),
      commands: playing
        ? [
            {
              id: "editor-undo",
              icon: "undo",
              title: "Undo Play Test",
              disabled: !playState.canUndo,
            },
            {
              id: "editor-redo",
              icon: "redo",
              title: "Redo Play Test",
              disabled: !playState.canRedo,
            },
            {
              id: "editor-restart",
              icon: "restart",
              title: "Restart Play Test",
            },
            {
              id: "editor-play",
              icon: "stop",
              title: "Stop Play Test",
              separatorBefore: true,
            },
          ]
        : [
            ...authoringCommands,
            {
              id: "editor-undo",
              icon: "undo",
              title: "Undo",
              separatorBefore: true,
            },
            { id: "editor-redo", icon: "redo", title: "Redo" },
            {
              id: "editor-play",
              icon: "play",
              title: "Play Test",
              separatorBefore: true,
            },
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
      leading: [
        {
          id: "editor-palette",
          icon: "palette",
          label: "Palette",
          pressed: leftPanel === "palette",
        },
        {
          id: "editor-surface",
          icon: "palette",
          label: "Surface",
          pressed: leftPanel === "surface",
        },
      ],
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
  const issue =
    issues.find((candidate) => candidate.level === "error") ?? issues[0]!;
  const suffix = issues.length > 1 ? ` · 共 ${issues.length} 个问题` : "";
  return [{
    text: `${issue.message}${suffix}`,
    icon: issue.level === "error" ? "error" as const : "warning" as const,
  }];
}
