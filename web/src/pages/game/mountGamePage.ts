import {
  adventureAugmentationFor,
  isAdventureLevelUnlocked,
  planAdventurePlayer,
  planAdventureSession,
  setAdventureResumeLevel,
  type AdventureSave,
} from "@bobby/adventure";
import {
  DEFAULT_CAMERA_OPTIONS,
  type AudioRuntime,
  type CameraOptions,
  type ImageManager,
} from "@bobby/engine";
import { MapEntityTypeId, type LevelMap } from "@bobby/model";
import { createApp } from "vue";
import type {
  AdventureIndex,
  AdventureIndexChapter,
  AdventureIndexLevel,
  AdventureIndexSpecialScene,
  MapMeta,
} from "../../services/catalog/catalog.js";
import {
  NOOP_CONTROLLER,
  type Navigate,
  type PageController,
} from "../../app/pageContracts.js";
import {
  loadAdventureSave,
  saveAdventureSave,
} from "../../storage/adventureSaveStorage.js";
import {
  rememberExploreMap,
  markExploreMapCompleted,
} from "../../storage/exploreProgressStorage.js";
import { createGameSession } from "../../runtime/game/createGameSession.js";
import {
  completedResultHtml,
  failedResultHtml,
} from "./resultFormatting.js";
import GamePage from "./GamePage.vue";
import {
  bindReplayPanel,
  type ReplayPanelController,
} from "./bindReplayPanel.js";
import { resolveGameMusic } from "./gameMusic.js";
import { AdventureRewardSession } from "./adventureRewardSession.js";
import {
  loadReplayPanelOpen,
  storeReplayPanelOpen,
} from "./replayPanelState.js";
import { replayPathId } from "./replayAssets.js";
import {
  canonicalExploreReplayUrl,
  canonicalReplayUrl,
  editorMapPath,
  exploreCollectionPath,
  explorePlayPath,
  replayAssetUrl,
  type ExploreMapRef,
} from "../../app/routes.js";
import { siteUrl } from "../../services/assets/gameAssets.js";
import {
  configureShell,
  type ShellConfig,
} from "../../shell/shellBridge.js";
import { getWebSettings } from "../../storage/settingsStorage.js";
import {
  globalActions,
  pageIdentity,
} from "../../app/pageChrome.js";
import {
  resolveGamePageCapabilities,
  type GamePageMode,
} from "./gamePageCapabilities.js";
import {
  prepareAdventureGameplayLevel,
} from "./adventurePurchase.js";
import { resolveGameplayHudConfig } from "./gameplayHudConfig.js";

export type { GamePageMode } from "./gamePageCapabilities.js";

// TODO 需要根据屏幕宽度设置更好
const GAME_CAMERA_OPTIONS: Record<GamePageMode, CameraOptions> = {
  explore: {
    zoom: 1.1,
    minZoom: .25,
    maxZoom: 4,
    panBounds: "map-edge",
  },
  adventure: {
    zoom: 1.05,
    minZoom: 0.8,
    maxZoom: 1.15,
    panBounds: "viewport",
  },
};

export interface GameIdentity {
  collection: string;
  id: string;
  title: string;
}

export interface GamePageContext {
  app: HTMLDivElement;
  adventure: AdventureIndex;
  audio: AudioRuntime;
  images: ImageManager;
  navigate: Navigate;
  level: LevelMap;
  identity: GameIdentity;
  mapMeta?: MapMeta;
  exploreNextMapId?: string;
  explorePreviousMapId?: string;
  adventureChapter?: AdventureIndexChapter;
  adventureLevel?: AdventureIndexLevel;
  adventureScene?: AdventureIndexSpecialScene;
  adventureBackPath?: string;
  adventureCompletionPath?: string;
  replayMap?: ExploreMapRef;
  mode: GamePageMode;
}

export async function renderGamePage(
  context: GamePageContext,
): Promise<PageController> {
  const {
    app,
    adventure,
    audio,
    images,
    navigate,
    level,
    identity,
    mapMeta,
    exploreNextMapId,
    explorePreviousMapId,
    adventureChapter,
    adventureLevel,
    adventureScene,
    adventureBackPath,
    adventureCompletionPath,
    replayMap,
    mode,
  } = context;
  const campaignNode = Boolean(adventureChapter && adventureLevel);
  if (mode === "adventure" && !campaignNode && !adventureScene) {
    throw new Error("Adventure GamePage 需要 Campaign node 或 Special Scene");
  }

  let adventureSave: AdventureSave | null =
    mode === "adventure" ? loadAdventureSave() : null;
  if (
    adventureSave &&
    campaignNode &&
    !isAdventureLevelUnlocked(adventureSave, adventureLevel!.id)
  ) {
    navigate(`/adventure/chapter/${adventureChapter!.id}`);
    return NOOP_CONTROLLER;
  }
  if (adventureSave && campaignNode) {
    const next = setAdventureResumeLevel(adventureSave, adventureLevel!.id);
    if (next.campaign.resumeLevelId !== adventureSave.campaign.resumeLevelId)
      adventureSave = saveAdventureSave(next);
  }
  if (mode === "explore") {
    rememberExploreMap(identity.collection, identity.id);
  }

  const capabilities = resolveGamePageCapabilities(mode, import.meta.env.DEV);
  const replayTarget = replayMap ?? identity;
  const sessionPlan =
    adventureSave && campaignNode
      ? planAdventureSession(adventureLevel!.id, adventureSave)
      : null;
  const adventureContentId = adventureLevel?.id ?? adventureScene?.id;
  const adventureAugmentation = adventureContentId
    ? adventureAugmentationFor(adventureContentId)
    : { levelPatches: [] };
  const plan = adventureSave
    ? (sessionPlan ?? planAdventurePlayer(adventureSave))
    : null;
  const prepareSessionLevel = (): LevelMap =>
    adventureContentId
      ? prepareAdventureGameplayLevel(
          level,
          adventureAugmentation,
          adventureSave,
          sessionPlan?.levelPatches ?? [],
        )
      : level;
  const sessionLevel = prepareSessionLevel();
  const availableBonusCoins = sessionLevel.entities.filter(
    (entity) => entity.type === MapEntityTypeId.BONUS_COIN,
  ).length;
  const screenControlEnabled = getWebSettings().controls.screenControlEnabled;
  const replayPanelInitiallyOpen =
    capabilities.replayPanel && loadReplayPanelOpen();
  configureShell(
    gameShellConfig(
      mode,
      screenControlEnabled,
      explorePreviousMapId,
      exploreNextMapId,
      replayPanelInitiallyOpen,
      capabilities.replayPanel,
    ),
  );
  app.replaceChildren();
  const gamePage = createApp(GamePage, {
    mode,
    replayPanelEnabled: capabilities.replayPanel,
  });
  gamePage.mount(app);
  const adventureViewport = app.querySelector<HTMLElement>(
    ".adventure-game-viewport",
  );

  const canvas = required<HTMLCanvasElement>(app, "#game");
  const gameResult = required<HTMLDivElement>(app, "[data-result-overlay]");
  const resultContent = required<HTMLElement>(
    gameResult,
    "[data-result-card-content]",
  );
  const pendingVendorSaves = new Map<number, AdventureSave>();
  const session = await createGameSession({
    canvas,
    level: sessionLevel,
    gameOptions: {
      audio,
      images,
    },
    ...(adventureAugmentation.interaction
      ? {
          interaction: async ({ request, game, dialog }) => {
            if (!adventureSave) return;
            const actor = game.state.actors.find(
              (item) => item.id === request.actorId,
            );
            if (!actor) return;
            await adventureAugmentation.interaction?.({
              request: {
                requestId: request.requestId,
                actorId: request.actorId,
                entityId: request.entityId,
                objectType: request.objectType,
                x: request.x,
                y: request.y,
                action: request.action,
                ...(request.role ? { role: request.role } : {}),
                lockKeyCount: actor.inventory.lockKeys,
              },
              save: adventureSave,
              showDialogue: (text) => dialog?.show(text),
              presentDialogue: (presentation) =>
                dialog?.present(presentation) ??
                  Promise.resolve({ type: "dismissed" as const }),
              commitSave: (save) => {
                adventureSave = saveAdventureSave(save);
              },
              addActorInventoryItem: (item, count, saveOnAccepted) => {
                if (saveOnAccepted) {
                  pendingVendorSaves.set(request.requestId, saveOnAccepted);
                }
                game.dispatchInteractionEffect({
                  type: "add-actor-inventory-item",
                  actorId: request.actorId,
                  item,
                  count,
                  requestId: request.requestId,
                });
              },
              replaceInteractedEntity: (replacementType) => {
                game.dispatchInteractionEffect({
                  type: "commit-entity-replacement",
                  target: {
                    type: request.objectType,
                    x: request.x,
                    y: request.y,
                  },
                  replacementType,
                });
              },
            });
          },
        }
      : {}),
    runtime: {
      ...(plan
        ? { bobbyLocomotion: { moveMs: plan.bobbyMoveMs } }
        : {}),
      camera: GAME_CAMERA_OPTIONS[mode],
      hud: resolveGameplayHudConfig(
        mode,
        adventureScene?.id,
        () => adventureSave?.economy.bonusCoins ?? 0,
      ),
      input: {
        undo: mode === "explore",
        debug: capabilities.debug,
        screenJoystick: {
          enabled: screenControlEnabled,
        },
      },
    },
  });
  const { game, input, dialog } = session;
  const music = resolveGameMusic(level.music, {
    specialScene: adventureScene !== undefined,
  });
  const playLevelMusic = (): void => {
    if (music) audio.playMusic(music);
    else audio.stopMusic();
  };
  playLevelMusic();

  let levelStartedAt = performance.now();
  let waitingForLevelEntrance = true;
  let visibleResult: "death" | "complete" | null = null;
  let audibleResult: "death" | "complete" | null = null;
  let resultElapsedMs = 0;
  let completionRecorded = false;
  let completionNextId: string | undefined;
  let completionNavigationStarted = false;
  let replayPanelOpen = replayPanelInitiallyOpen;
  const adventureRewards = new AdventureRewardSession();
  const updateAdventureToolLayout = (): void => {
    adventureViewport?.classList.toggle(
      "adventure-game-tools-open",
      game.debug || replayPanelOpen,
    );
  };
  updateAdventureToolLayout();
  const replayPanel: ReplayPanelController = capabilities.replayPanel
    ? bindReplayPanel({
        root: app,
        game,
        filename: `${replayTarget.collection}-${replayTarget.id}`,
        builtinReplayUrl: siteUrl(
          replayAssetUrl(replayTarget.collection, replayTarget.id),
        ),
        meta: {
          id: replayPathId(replayTarget.collection, replayTarget.id),
          url: replayMap
            ? canonicalExploreReplayUrl(replayMap)
            : canonicalReplayUrl(window.location),
        },
        initialOpen: replayPanelInitiallyOpen,
        onVisibilityChange(open) {
          replayPanelOpen = open;
          updateAdventureToolLayout();
          storeReplayPanelOpen(open);
          configureShell(
            gameShellConfig(
              mode,
              getWebSettings().controls.screenControlEnabled,
              explorePreviousMapId,
              exploreNextMapId,
              open,
              capabilities.replayPanel,
            ),
          );
        },
        onTimelineRestart() {
          adventureRewards.discard();
          levelStartedAt = performance.now();
          waitingForLevelEntrance = true;
          resultElapsedMs = 0;
          visibleResult = null;
          audibleResult = null;
          completionRecorded = false;
          completionNextId = undefined;
          completionNavigationStarted = false;
          gameResult.hidden = true;
          playLevelMusic();
        },
      })
    : NOOP_REPLAY_PANEL_CONTROLLER;

  const closeResult = (): void => {
    visibleResult = null;
    gameResult.hidden = true;
  };

  const recordLevelCompletion = (): void => {
    if (completionRecorded) return;
    completionRecorded = true;
    if (adventureSave && campaignNode) {
      adventureSave = saveAdventureSave(
        adventureRewards.complete(adventureSave, adventureLevel!.id),
      );
      completionNextId = nextAdventureLevel(adventure, adventureLevel!.id)?.id;
    } else if (mode === "explore") {
      markExploreMapCompleted(identity.collection, identity.id);
      completionNextId = exploreNextMapId;
    }
  };

  const renderResult = (): void => {
    if (!game.hasLevel) return;
    const state = game.state;
    const kind =
      state.status === "dead"
        ? "death"
        : state.status === "won"
          ? "complete"
          : null;
    if (kind === "death") adventureRewards.discard();
    if (kind === "complete") recordLevelCompletion();
    if (!kind) {
      if (audibleResult !== null) playLevelMusic();
      audibleResult = null;
      resultElapsedMs = 0;
      completionRecorded = false;
      completionNextId = undefined;
      closeResult();
      return;
    }
    if (audibleResult !== kind) {
      audibleResult = kind;
      resultElapsedMs = performance.now() - levelStartedAt;
      audio.playMusic(kind === "complete" ? "cleared" : "death");
    }
    if (game.isAnimating) return;
    if (
      kind === "complete" &&
      adventureCompletionPath &&
      !completionNavigationStarted
    ) {
      completionNavigationStarted = true;
      navigate(adventureCompletionPath);
      return;
    }
    if (visibleResult === kind) return;
    visibleResult = kind;
    if (kind === "complete") {
      resultContent.innerHTML = completedResultHtml({
        elapsedMs: resultElapsedMs,
        moves: state.moves,
        collectedCoins: Math.max(
          0,
          availableBonusCoins - state.bonusCoinsInLevel,
        ),
        availableCoins: availableBonusCoins,
        ...(adventureSave
          ? { totalCoins: adventureSave.economy.bonusCoins }
          : {}),
        ...(completionNextId ? { nextId: completionNextId } : {}),
      });
    } else {
      resultContent.innerHTML = failedResultHtml();
    }
    gameResult.hidden = false;
  };

  const update = (): void => {
    if (waitingForLevelEntrance && !game.presentationBlocksInput) {
      levelStartedAt = performance.now();
      waitingForLevelEntrance = false;
    }
    updateAdventureToolLayout();
    renderResult();
    replayPanel.update();
  };
  game.on("change", update);
  game.on("debug-change", update);
  update();

  const askUndo = (): void => {
    if (mode === "explore" && game.canUndo) {
      game.undo();
      closeResult();
    }
  };
  const askRedo = (): void => {
    if (mode === "explore" && game.canRedo) {
      game.redo();
      closeResult();
    }
  };
  const askRestart = async (): Promise<void> => {
    adventureRewards.discard();
    if (adventureSave && adventureContentId) {
      await game.loadLevel(prepareSessionLevel());
    } else {
      game.restart();
    }
    levelStartedAt = performance.now();
    waitingForLevelEntrance = true;
    resultElapsedMs = 0;
    completionNavigationStarted = false;
    closeResult();
    update();
  };

  gameResult.addEventListener("click", (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>(
      "button[data-result]",
    );
    if (!button) return;
    const action = button.dataset.result;
    if (action === "retry") void askRestart();
    else if (action === "levels") {
      navigate(backPath(identity, mode, adventureBackPath));
    } else if (action === "next" && button.dataset.next) {
      navigate(
        mode === "adventure"
          ? `/adventure/play/${button.dataset.next}`
          : explorePlayPath({
              collection: identity.collection,
              id: button.dataset.next,
            }),
      );
    }
  });

  const onGameShellAction = (event: Event): void => {
    const action = (event as CustomEvent<{ action: string }>).detail.action;
    if (action === "back") {
      navigate(backPath(identity, mode, adventureBackPath));
    } else if (action === "previous-level" && explorePreviousMapId) {
      navigate(
        explorePlayPath({
          collection: identity.collection,
          id: explorePreviousMapId,
        }),
      );
    } else if (action === "next-level" && exploreNextMapId) {
      navigate(
        explorePlayPath({
          collection: identity.collection,
          id: exploreNextMapId,
        }),
      );
    } else if (action === "edit") {
      navigate(
        identity.collection === "imported" ? "/edit" : editorMapPath(identity),
      );
    } else if (action === "undo") askUndo();
    else if (action === "redo") askRedo();
    else if (action === "restart") void askRestart();
    else if (action === "replay-record") replayPanel.toggle();
  };
  window.addEventListener("game-shell-action", onGameShellAction);
  const disposeGameShell = bindGameShell(input, screenControlEnabled);
  const unsubscribeWorldEvents = game.onWorldEvent((event) => {
    if (
      event.type === "actor-inventory-item-added" &&
      event.data?.item === MapEntityTypeId.LOCK_KEY &&
      event.requestId !== undefined
    ) {
      const pending = pendingVendorSaves.get(event.requestId);
      if (pending) {
        adventureSave = saveAdventureSave(pending);
        pendingVendorSaves.delete(event.requestId);
      }
    }
    if (adventureSave && adventureLevel) adventureRewards.record(event);
  });

  return {
    destroy(): void {
      window.removeEventListener("game-shell-action", onGameShellAction);
      disposeGameShell();
      unsubscribeWorldEvents();
      replayPanel.destroy();
      session.destroy();
      gamePage.unmount();
    },
  };
}

function nextAdventureLevel(
  adventure: AdventureIndex,
  currentId: string,
): AdventureIndexLevel | undefined {
  const levels = adventure.chapters.flatMap((chapter) => chapter.levels);
  const index = levels.findIndex((level) => level.id === currentId);
  return index >= 0 ? levels[index + 1] : undefined;
}

function gameShellConfig(
  mode: GamePageMode,
  screenControlEnabled: boolean,
  explorePreviousMapId?: string,
  exploreNextMapId?: string,
  replayOpen = false,
  replayEnabled = mode === "explore",
): ShellConfig {
  const explore = mode === "explore";
  return {
    topBar: {
      visible: true,
      fixed: true,
      identity: pageIdentity(
        explore ? "自由探索模式" : "冒险模式",
        explore ? "/explore" : "/adventure",
        false,
      ),
      back: {
        id: "back",
        icon: "back",
        label: "返回",
        title: "返回",
      },
      leading: [
        ...(explore
          ? [
              {
                id: "previous-level",
                icon: "previous-track" as const,
                title: "上一关",
                disabled: !explorePreviousMapId,
                collapse: "hide" as const,
              },
              {
                id: "next-level",
                icon: "next-track" as const,
                title: "下一关",
                disabled: !exploreNextMapId,
                collapse: "hide" as const,
              },
            ]
          : []),
        {
          id: "restart",
          icon: "restart" as const,
          title: "重新开始",
        },
      ],
      commands: explore
        ? [
            { id: "undo", icon: "undo" as const, title: "撤销" },
            { id: "redo", icon: "redo" as const, title: "重做" },
          ]
        : [],
      actions: [
        ...(explore
          ? [
              {
                id: "edit",
                icon: "edit-map" as const,
                label: "编辑地图",
                title: "在编辑器中打开",
                collapse: "overflow" as const,
              },
            ]
          : []),
        ...globalActions(),
      ],
    },
    bottomBar: {
      visible: true,
      fixed: true,
      leading: replayEnabled
        ? [
            {
              id: "replay-record",
              icon: "record",
              label: "录制",
              title: "录制 Replay 测试输入",
              pressed: replayOpen,
            },
          ]
        : [],
      trailing: [
        {
          id: "screen-control",
          icon: "joystick",
          label: "屏幕摇杆",
          pressed: screenControlEnabled,
        },
      ],
    },
  };
}

const NOOP_REPLAY_PANEL_CONTROLLER: ReplayPanelController = {
  toggle() {},
  update() {},
  stopRecording() {},
  destroy() {},
};

function backPath(
  identity: GameIdentity,
  mode: GamePageMode,
  adventureBackPath?: string,
): string {
  return mode === "adventure"
    ? (adventureBackPath ?? "/adventure")
    : identity.collection === "imported"
      ? "/"
      : exploreCollectionPath(identity.collection);
}

function bindGameShell(
  input: {
    setEnabled(value: boolean): void;
    setScreenJoystickEnabled(value: boolean): void;
  },
  initialScreenControlEnabled: boolean,
): () => void {
  let screenControlEnabled = initialScreenControlEnabled;
  const updateScreenControl = (): void => {
    input.setScreenJoystickEnabled(screenControlEnabled);
  };
  updateScreenControl();
  const onScreenControlChange = (event: Event): void => {
    screenControlEnabled = Boolean(
      (event as CustomEvent<{ enabled: boolean }>).detail.enabled,
    );
    updateScreenControl();
  };
  const onDialogOpen = (): void => input.setEnabled(false);
  const onDialogClose = (): void => input.setEnabled(true);
  window.addEventListener("screen-control-change", onScreenControlChange);
  window.addEventListener("shell-dialog-open", onDialogOpen);
  window.addEventListener("shell-dialog-close", onDialogClose);
  return () => {
    window.removeEventListener("screen-control-change", onScreenControlChange);
    window.removeEventListener("shell-dialog-open", onDialogOpen);
    window.removeEventListener("shell-dialog-close", onDialogClose);
  };
}

function required<T extends Element>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Game UI failed to mount: ${selector}`);
  return element;
}
