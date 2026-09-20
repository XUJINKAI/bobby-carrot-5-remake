import {
  adventureAugmentationFor,
  isAdventureLevelUnlocked,
  planAdventurePlayer,
  planAdventureSession,
  setAdventureResumeLevel,
  type AdventureSave,
} from "@bobby/adventure";
import {
  type AudioRuntime,
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
import { bindGameplayShell } from "../../runtime/game/bindGameplayShell.js";
import {
  completedResultHtml,
  failedResultHtml,
} from "./resultFormatting.js";
import GamePage from "./GamePage.vue";
import {
  bindReplayPanel,
  type ReplayPanelController,
} from "./bindReplayPanel.js";
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
import {
  gameMapVerificationStatus,
  mapStatusIndicator,
} from "./mapStatusIndicator.js";
import { webT } from "../../i18n/webI18n.js";
import { gameplayCameraOptions } from "./gameplayCameraOptions.js";

export type { GamePageMode } from "./gamePageCapabilities.js";

export interface GameIdentity {
  collection: string;
  id: string;
  title: string;
}

export type GamePageSource = "adventure" | "explore" | "import";

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
  verified?: boolean;
  mode: GamePageMode;
  source: GamePageSource;
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
    verified = false,
    mode,
    source,
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
  const statusMapId = `${replayTarget.collection}/${replayTarget.id}`;
  const statusMapName = mapMeta?.name ?? identity.title;
  configureShell(
    gameShellConfig(
      mode,
      source,
      screenControlEnabled,
      statusMapId,
      statusMapName,
      explorePreviousMapId,
      exploreNextMapId,
      replayPanelInitiallyOpen,
      capabilities.replayPanel,
      verified,
      mapMeta,
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
              showDialogue: (text) =>
                dialog?.show(text) ??
                  Promise.resolve({ type: "dismissed" as const }),
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
      camera: gameplayCameraOptions(mode),
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
  const { game } = session;

  let visibleResult: "death" | "complete" | null = null;
  let capturedResult: "death" | "complete" | null = null;
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
              source,
              getWebSettings().controls.screenControlEnabled,
              statusMapId,
              statusMapName,
              explorePreviousMapId,
              exploreNextMapId,
              open,
              capabilities.replayPanel,
              verified,
              mapMeta,
            ),
          );
        },
        onTimelineRestart() {
          adventureRewards.discard();
          resultElapsedMs = 0;
          visibleResult = null;
          capturedResult = null;
          completionRecorded = false;
          completionNextId = undefined;
          completionNavigationStarted = false;
          gameResult.hidden = true;
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
      resultElapsedMs = 0;
      capturedResult = null;
      completionRecorded = false;
      completionNextId = undefined;
      closeResult();
      return;
    }
    if (capturedResult !== kind) {
      capturedResult = kind;
      resultElapsedMs = state.elapsedMs;
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
  const disposeGameShell = bindGameplayShell(session, {
    initialScreenControlEnabled: screenControlEnabled,
  });
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
    localeChanged(): void {
      configureShell(
        gameShellConfig(
          mode,
          source,
          getWebSettings().controls.screenControlEnabled,
          statusMapId,
          statusMapName,
          explorePreviousMapId,
          exploreNextMapId,
          replayPanelOpen,
          capabilities.replayPanel,
          verified,
          mapMeta,
        ),
      );
      visibleResult = null;
      renderResult();
      replayPanel.update();
    },
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
  source: GamePageSource,
  screenControlEnabled: boolean,
  mapId: string,
  mapName: string,
  explorePreviousMapId?: string,
  exploreNextMapId?: string,
  replayOpen = false,
  replayEnabled = mode === "explore",
  verified = false,
  mapMeta?: MapMeta,
): ShellConfig {
  const explore = mode === "explore";
  const shellIdentity = source === "import"
    ? pageIdentity(webT("context.import"), "/import/v1", false)
    : pageIdentity(
        source === "explore" ? webT("nav.explore") : webT("nav.adventure"),
        source === "explore" ? "/explore" : "/adventure",
        false,
      );
  return {
    topBar: {
      visible: true,
      fixed: true,
      identity: shellIdentity,
      back: {
        id: "back",
        icon: "back",
        label: webT("shell.back"),
        title: webT("shell.back"),
      },
      leading: [
        ...(explore
          ? [
              {
                id: "previous-level",
                icon: "previous-track" as const,
                title: webT("shell.previousLevel"),
                disabled: !explorePreviousMapId,
                collapse: "hide" as const,
              },
              {
                id: "next-level",
                icon: "next-track" as const,
                title: webT("shell.nextLevel"),
                disabled: !exploreNextMapId,
                collapse: "hide" as const,
              },
            ]
          : []),
        {
          id: "restart",
          icon: "restart" as const,
          title: webT("shell.restart"),
        },
      ],
      commands: explore
        ? [
            { id: "undo", icon: "undo" as const, title: webT("shell.undo") },
            { id: "redo", icon: "redo" as const, title: webT("shell.redo") },
          ]
        : [],
      actions: [
        ...(explore
          ? [
              {
                id: "edit",
                icon: "edit-map" as const,
                label: webT("shell.editMap"),
                title: webT("shell.openInEditor"),
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
              label: webT("shell.record"),
              title: webT("shell.recordReplay"),
              pressed: replayOpen,
            },
          ]
        : [],
      leadingIndicators: [
        mapStatusIndicator(
          gameMapVerificationStatus(mode, verified),
          mapId,
          mapName,
          mapMeta,
        ),
      ],
      trailing: [
        {
          id: "screen-control",
          icon: "joystick",
          label: webT("shell.screenJoystick"),
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

function required<T extends Element>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Game UI failed to mount: ${selector}`);
  return element;
}
