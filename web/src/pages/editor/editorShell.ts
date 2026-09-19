import type {
  EditorTool,
  LevelValidationIssue,
  SurfaceTool,
} from "@bobby/editor";
import {
  globalActions,
  pageIdentity,
} from "../../app/pageChrome.js";
import {
  configureShell,
  type ShellAction,
  type ShellConfig,
} from "../../shell/shellBridge.js";
import { webT } from "../../i18n/webI18n.js";

export interface EditorPlayShellState {
  canUndo: boolean;
  canRedo: boolean;
  replayReady: boolean;
  replayOpen: boolean;
  screenControlEnabled: boolean;
}

const EMPTY_PLAY_STATE: EditorPlayShellState = {
  canUndo: false,
  canRedo: false,
  replayReady: false,
  replayOpen: false,
  screenControlEnabled: false,
};

export function configureEditorShell(
  playing: boolean,
  tool: EditorTool = "select",
  issues: readonly LevelValidationIssue[] = [],
  playState: EditorPlayShellState = EMPTY_PLAY_STATE,
  leftPanel: "palette" | "surface" = "palette",
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
  );
}

export function editorShellConfig(
  playing: boolean,
  tool: EditorTool = "select",
  issues: readonly LevelValidationIssue[] = [],
  playState: EditorPlayShellState = EMPTY_PLAY_STATE,
  leftPanel: "palette" | "surface" = "palette",
  surfaceTool: SurfaceTool = "rect",
): ShellConfig {
  const authoringCommands: ShellAction[] =
    leftPanel === "surface"
      ? [
          {
            id: "editor-surface-select",
            icon: "select",
            title: webT("editor.select"),
            pressed: surfaceTool === "rect",
          },
          {
            id: "editor-surface-brush",
            icon: "edit",
            title: webT("editor.brush"),
            pressed: surfaceTool === "brush",
          },
          {
            id: "editor-surface-fill",
            icon: "fill",
            title: webT("editor.fill"),
            pressed: surfaceTool === "fill",
          },
        ]
      : [
          {
            id: "editor-tool-select",
            icon: "select",
            title: webT("editor.select"),
            pressed: tool === "select",
          },
          {
            id: "editor-tool-brush",
            icon: "edit",
            title: webT("editor.brush"),
            pressed: tool === "place",
          },
          {
            id: "editor-tool-erase",
            icon: "delete",
            title: webT("editor.erase"),
            pressed: tool === "erase",
          },
        ];

  return {
    topBar: {
      visible: true,
      fixed: true,
      identity: pageIdentity(webT("nav.editor"), "/edit"),
      commands: playing
        ? [
            {
              id: "editor-undo",
              icon: "undo",
              title: webT("editor.undoPlay"),
              disabled: !playState.canUndo,
            },
            {
              id: "editor-redo",
              icon: "redo",
              title: webT("editor.redoPlay"),
              disabled: !playState.canRedo,
            },
            {
              id: "editor-restart",
              icon: "restart",
              title: webT("editor.restartPlay"),
            },
            {
              id: "editor-play",
              icon: "stop",
              title: webT("editor.stopPlay"),
              separatorBefore: true,
            },
          ]
        : [
            ...authoringCommands,
            {
              id: "editor-undo",
              icon: "undo",
              title: webT("shell.undo"),
              separatorBefore: true,
            },
            { id: "editor-redo", icon: "redo", title: webT("shell.redo") },
            {
              id: "editor-play",
              icon: "play",
              title: webT("editor.play"),
              separatorBefore: true,
            },
          ],
      actions: [
        {
          id: "editor-share",
          icon: "share",
          label: webT("editor.share"),
          title: webT("editor.shareTitle"),
          collapse: "overflow",
        },
        ...globalActions(),
      ],
    },
    bottomBar: {
      visible: true,
      fixed: true,
      leading: playing
        ? [
            {
              id: "editor-replay-record",
              icon: "record",
              label: webT("shell.record"),
              title: webT("shell.recordReplay"),
              disabled: !playState.replayReady,
              pressed: playState.replayOpen,
            },
          ]
        : [
            {
              id: "editor-palette",
              icon: "palette",
              label: webT("editor.palette"),
              pressed: leftPanel === "palette",
            },
            {
              id: "editor-surface",
              icon: "palette",
              label: webT("editor.surface"),
              pressed: leftPanel === "surface",
            },
          ],
      info: shellIssueInfo(issues),
      trailing: playing
        ? [
            {
              id: "screen-control",
              icon: "joystick",
              label: webT("shell.screenJoystick"),
              pressed: playState.screenControlEnabled,
            },
          ]
        : [
            { id: "editor-inspector", icon: "inspector", label: webT("editor.inspector") },
            { id: "editor-level-info", icon: "info", label: webT("editor.level") },
          ],
    },
  };
}

function shellIssueInfo(issues: readonly LevelValidationIssue[]) {
  if (issues.length === 0) return [];
  const issue =
    issues.find((candidate) => candidate.level === "error") ?? issues[0]!;
  const suffix = issues.length > 1
    ? ` · ${webT("editor.issueCount", { count: issues.length })}`
    : "";
  return [{
    text: `${issue.message}${suffix}`,
    icon: issue.level === "error" ? "error" as const : "warning" as const,
  }];
}
