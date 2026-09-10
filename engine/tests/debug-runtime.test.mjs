import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";
import { MapEntityTypeId } from "@bobby/model";
import { buildDebugSnapshot } from "../dist/debug/DebugSnapshot.js";
import { createBuiltinVisualRegistry } from "../dist/entities/registry.js";
import { resolveEngineTiming } from "../dist/time/EngineTiming.js";
import { PresentationClock } from "../dist/time/PresentationClock.js";
import { WorldClock } from "../dist/time/WorldClock.js";
import { VisualRuntime } from "../dist/visual/VisualRuntime.js";
import { World } from "../dist/world/World.js";

const ground = (x, y) => ({ type: "grass", variant: "ts-10-1", x, y });

function debugTime() {
  const timing = resolveEngineTiming();
  const worldClock = new WorldClock(timing.worldHz);
  const presentationClock = new PresentationClock(timing.presentationHz);
  presentationClock.advance(1000);
  return { timing, worldClock, presentationClock };
}

test("Debug snapshot exposes runtime clocks, selected actor, actions and inspected Entity facts", () => {
  const world = new World({
    schemaVersion: 1,
    width: 2,
    height: 1,
    entities: [
      ground(0, 0),
      ground(1, 0),
      { type: MapEntityTypeId.BOBBY, x: 0, y: 0, direction: "right" },
    ],
  });
  const visual = new VisualRuntime(createBuiltinVisualRegistry());
  const { timing, worldClock, presentationClock } = debugTime();
  worldClock.pause();
  worldClock.step(4, (time) => world.update(time));
  const frame = presentationClock.advance(1017);
  assert.ok(frame);
  visual.update(frame, "linear");
  const bobby = world.entities
    .all()
    .find((entity) => entity.type === MapEntityTypeId.BOBBY);
  assert.ok(bobby);
  bobby.direction = "right";

  const scene = visual.scene(world);
  const snapshot = buildDebugSnapshot({
    world,
    scene,
    visual,
    worldClock,
    presentationClock,
    timing,
    input: null,
    setup: {
      worldHz: 60,
      bobbyLocomotion: { moveMs: 350 },
      initialIntents: [
        {
          type: "set-actor-locomotion",
          actorId: bobby.id,
          moveDurationMs: 280,
        },
      ],
    },
    controls: [{ input: "external", targets: [{ entityId: bobby.id }] }],
    gameplayState: {
      status: "playing",
      deathReason: null,
      moves: 0,
      primaryActorId: bobby.id,
      actors: [
        {
          id: bobby.id,
          position: { x: 0, y: 0 },
          facing: "right",
          inventory: {
            gas: false,
            kite: false,
            shovel: false,
            beans: 0,
            singleUseLockKey: false,
            reusableLockKey: false,
          },
          moveDurationMs: 280,
        },
      ],
      player: { x: 0, y: 0 },
      facing: "right",
      inventory: {
        gas: false,
        kite: false,
        shovel: false,
        beans: 0,
        singleUseLockKey: false,
        reusableLockKey: false,
      },
      bonusCoinsInLevel: 0,
      goldenCarrotsInLevel: 0,
      canUndo: false,
      canRedo: false,
    },
    pendingIntents: [
      {
        type: "set-actor-lock-key",
        actorId: bobby.id,
        kind: "single-use",
        enabled: true,
      },
    ],
    replay: { recording: true, playing: false, paused: false },
    selection: { cell: { x: 0, y: 0 }, entityId: bobby.id },
  });

  assert.equal(snapshot.runtime.worldTickCount, 4);
  assert.equal(snapshot.runtime.worldPaused, true);
  assert.equal(snapshot.runtime.worldHz, 60);
  assert.equal(snapshot.runtime.presentationHz, 60);
  assert.equal(snapshot.runtime.presentationFrame, 1);
  assert.equal(snapshot.runtime.presentationPaused, false);
  assert.equal(snapshot.runtime.actionCount, 0);
  assert.equal(snapshot.actions.length, 0);
  assert.equal(snapshot.input, null);
  assert.deepEqual(snapshot.actors, [{ id: bobby.id, type: MapEntityTypeId.BOBBY }]);
  assert.equal(snapshot.actor?.id, bobby.id);
  assert.equal(snapshot.actor?.type, MapEntityTypeId.BOBBY);
  assert.deepEqual(snapshot.actor?.anchor, { x: 0, y: 0 });
  assert.deepEqual(snapshot.actor?.worldPose, { x: 0, y: 0 });
  assert.equal(snapshot.actor?.worldMotion, null);
  assert.equal(snapshot.actor?.lifecycle.phase, "active");
  assert.equal(snapshot.actor?.inputBlocked, false);
  assert.equal(snapshot.actor?.direction, "right");
  assert.equal("status" in snapshot.runtime, false);
  assert.equal("player" in snapshot.runtime, false);
  assert.equal("facing" in snapshot.runtime, false);
  assert.deepEqual(snapshot.selection?.cell, { x: 0, y: 0 });
  assert.equal("playerHere" in snapshot.selection, false);
  assert.equal(snapshot.selection?.entity?.id, bobby.id);
  assert.equal(snapshot.selection?.entity?.type, MapEntityTypeId.BOBBY);
  assert.equal(snapshot.selection?.entity?.direction, "right");
  assert.ok(snapshot.selection?.entity?.definition.traits.includes("player"));
  assert.ok(snapshot.selection?.entity?.behaviors.length >= 0);
  assert.ok(snapshot.selection?.entity?.visual.visualId);
  assert.ok((snapshot.selection?.entity?.visual.renderItems.length ?? 0) > 0);
  assert.equal(snapshot.world?.setup.gameplay.bobbyLocomotion.moveMs, 350);
  assert.equal(snapshot.world?.setup.gameplay.initialIntents.length, 1);
  assert.equal(snapshot.world?.setup.controls[0]?.input, "external");
  assert.equal(snapshot.world?.current.gameplay.actors[0]?.moveDurationMs, 280);
  assert.equal(snapshot.world?.pendingIntents[0]?.type, "set-actor-lock-key");
  assert.equal(snapshot.world?.replay.recording, true);
  assert.equal(snapshot.world?.canDispatchActorEffects, true);
});

test("Debug snapshot can track a non-primary player actor", () => {
  const world = new World({
    schemaVersion: 1,
    width: 2,
    height: 1,
    entities: [
      ground(0, 0),
      ground(1, 0),
      { type: MapEntityTypeId.BOBBY, x: 0, y: 0, direction: "right" },
      { type: MapEntityTypeId.BOBBY, x: 1, y: 0, direction: "left" },
    ],
  });
  const visual = new VisualRuntime(createBuiltinVisualRegistry());
  const { timing, worldClock, presentationClock } = debugTime();
  visual.scene(world);
  const actors = world.query.entitiesWithTrait("player");
  assert.equal(actors.length, 2);

  const snapshot = buildDebugSnapshot({
    world,
    scene: visual.scene(world),
    visual,
    worldClock,
    presentationClock,
    timing,
    input: null,
    actorId: actors[1].id,
    selection: null,
  });

  assert.equal(snapshot.actors.length, 2);
  assert.equal(snapshot.actor?.id, actors[1].id);
  assert.deepEqual(snapshot.actor?.anchor, { x: 1, y: 0 });
});

test("Debug snapshot defaults selection to the top Presence", () => {
  const world = new World({
    schemaVersion: 1,
    width: 1,
    height: 1,
    entities: [
      ground(0, 0),
      { type: MapEntityTypeId.BOBBY, x: 0, y: 0, direction: "down" },
    ],
  });
  const visual = new VisualRuntime(createBuiltinVisualRegistry());
  const { timing, worldClock, presentationClock } = debugTime();
  const snapshot = buildDebugSnapshot({
    world,
    scene: visual.scene(world),
    visual,
    worldClock,
    presentationClock,
    timing,
    input: null,
    selection: { cell: { x: 0, y: 0 } },
  });
  assert.equal(snapshot.selection?.entity?.type, MapEntityTypeId.BOBBY);
  assert.equal(snapshot.selection?.presences.at(-1)?.stackOrder, 100);
});

test("Debug uses docked control and info panes behind a persistent tool strip", () => {
  const source = fs.readFileSync(
    new URL("../src/debug/DebugSidebar.ts", import.meta.url),
    "utf8",
  );
  const controlSource = fs.readFileSync(
    new URL("../src/debug/DebugControlPanel.ts", import.meta.url),
    "utf8",
  );
  const timelineSource = fs.readFileSync(
    new URL("../src/debug/DebugTimelinePanel.ts", import.meta.url),
    "utf8",
  );
  const worldSource = fs.readFileSync(
    new URL("../src/debug/DebugWorldPanel.ts", import.meta.url),
    "utf8",
  );
  assert.match(
    source,
    /type DebugTab = "inspect" \| "timeline" \| "actor" \| "world"/,
  );
  assert.match(controlSource, /engine-debug-control-rail/);
  assert.match(source, /engine-debug-sidebar/);
  assert.match(source, /engine-debug-tool-strip/);
  assert.match(source, /TOOL_STRIP_WIDTH = 44/);
  assert.match(source, /CONTROL_PANE_WIDTH = 220/);
  assert.match(source, /INFO_PANE_WIDTH = 440/);
  assert.match(source, /this\.controlVisible = !this\.controlVisible/);
  assert.match(source, /this\.infoVisible = !this\.infoVisible/);
  assert.match(source, /createGameplayRightInset/);
  assert.match(source, /this\.gameplayInset\.set\(dockWidth\)/);
  assert.match(source, /layoutChanged/);
  assert.doesNotMatch(source, /toggleControlCollapsed/);
  assert.doesNotMatch(source, /toggleSidebarCollapsed/);
  assert.doesNotMatch(source, /Close Engine Debug/);
  assert.doesNotMatch(source, /close\(\): void/);
  assert.match(controlSource, /private readonly worldPauseResumeButton/);
  assert.match(controlSource, /private readonly worldStepButton/);
  assert.match(controlSource, /private readonly presentationPauseResumeButton/);
  assert.match(controlSource, /private readonly frameBackButton/);
  assert.match(controlSource, /private readonly frameForwardButton/);
  assert.match(controlSource, /private readonly nextSpriteButton/);
  assert.match(controlSource, /private readonly nextChangeButton/);
  assert.match(controlSource, /private readonly actorSelect/);
  assert.match(controlSource, /Double-click map: teleport selected actor/);
  assert.match(source, /\["inspect", "Inspect"\]/);
  assert.match(source, /\["timeline", "Timeline"\]/);
  assert.match(source, /\["actor", "Actor"\]/);
  assert.match(source, /\["world", "World"\]/);
  assert.match(source, /this\.setTab\("inspect"\)/);
  assert.match(source, /Runtime actions/);
  assert.match(source, /Input channels/);
  assert.match(controlSource, /setHeldDirection/);
  assert.match(controlSource, /selectActor/);
  assert.match(controlSource, /stepPresentationToNextSprite/);
  assert.match(timelineSource, /entry\.kind !== "world-tick"/);
  assert.match(timelineSource, /this\.worldTicks\.checked = false/);
  assert.match(worldSource, /Intent injector/);
  assert.match(worldSource, /set-actor-locomotion/);
  assert.match(worldSource, /set-actor-lock-key/);
  assert.match(worldSource, /dispatchIntent/);
  assert.match(source, /presence\.stackOrder/);
  assert.match(source, /Resolved layers/);
});

test("Debug dock reserves actual gameplay width and floating controls follow the same inset", () => {
  const mountSource = fs.readFileSync(
    new URL("../src/ui/gameplayMount.ts", import.meta.url),
    "utf8",
  );
  const hudSource = fs.readFileSync(
    new URL("../src/ui/GameplayHudView.ts", import.meta.url),
    "utf8",
  );
  const joystickSource = fs.readFileSync(
    new URL("../src/input/ScreenJoystick.ts", import.meta.url),
    "utf8",
  );
  assert.match(mountSource, /--engine-gameplay-right-inset/);
  assert.match(mountSource, /canvas\.style\.width = `calc\(100% - var\(/);
  assert.match(hudSource, /GAMEPLAY_RIGHT_INSET_CSS_VAR/);
  assert.match(hudSource, /right: `calc\(12px \+ var\(/);
  assert.match(joystickSource, /GAMEPLAY_RIGHT_INSET_CSS_VAR/);
  assert.match(joystickSource, /right: `var\(\$\{GAMEPLAY_RIGHT_INSET_CSS_VAR\}, 0px\)`/);
});

test("Web game page no longer owns a second legacy debug panel", () => {
  const stageSource = fs.readFileSync(
    new URL("../../web/src/pages/game/GameStage.vue", import.meta.url),
    "utf8",
  );
  const pageSource = fs.readFileSync(
    new URL("../../web/src/pages/game/mountGamePage.ts", import.meta.url),
    "utf8",
  );
  const formatterUrl = new URL(
    "../../web/src/runtime/game/formatTileInspection.ts",
    import.meta.url,
  );
  assert.doesNotMatch(stageSource, /data-debug-panel|debug-engine|debug-inspector/);
  assert.doesNotMatch(pageSource, /formatTileInspection|debugInspection|debugPanel/);
  assert.equal(fs.existsSync(formatterUrl), false);
});

test("Debug Sidebar keeps details DOM stable during presentation refresh", () => {
  const source = fs.readFileSync(
    new URL("../src/debug/DebugSidebar.ts", import.meta.url),
    "utf8",
  );
  const timelineSource = fs.readFileSync(
    new URL("../src/debug/DebugTimelinePanel.ts", import.meta.url),
    "utf8",
  );
  assert.match(source, /private readonly actorInputDetails/);
  assert.match(source, /private readonly actorPresentationDetails/);
  assert.match(source, /private setJson\(/);
  assert.doesNotMatch(source, /this\.actorPanel\.replaceChildren/);
  assert.doesNotMatch(source, /this\.inspectPanel\.replaceChildren/);
  assert.match(timelineSource, /if \(key === this\.renderKey\) return/);
});

test("Debug World pause freezes only the clock and preserves input state", () => {
  const source = fs.readFileSync(
    new URL("../src/core/Game.ts", import.meta.url),
    "utf8",
  );
  const pause = source.match(
    /private pauseDebugClock\(\): void \{[\s\S]*?\n  \}/,
  );
  assert.ok(pause);
  assert.match(pause[0], /this\.worldClock\.pause\(\)/);
  assert.doesNotMatch(pause[0], /setEnabled\(false\)/);
  assert.doesNotMatch(pause[0], /heldDirection = null/);
  assert.match(source, /input: this\.inputController\?\.inspectMovement\(\) \?\? null/);
  assert.match(source, /setHeldDirection: \(actorId, direction\)/);
  assert.match(source, /this\.setDebugHeldDirection\(actorId, direction\)/);
  assert.doesNotMatch(source, /close: \(\) => this\.setDebug\(false\)/);
});

test("Debug Runtime supports selected-actor teleport and semantic sprite stepping", () => {
  const source = fs.readFileSync(
    new URL("../src/debug/DebugRuntime.ts", import.meta.url),
    "utf8",
  );
  assert.match(source, /addEventListener\("dblclick", this\.onDoubleClick\)/);
  assert.match(source, /teleportActor\(actorId, inspection\.cell\)/);
  assert.match(source, /trackedActorId/);
  assert.match(source, /stepPresentationToNextSprite/);
  assert.match(source, /spriteSignature/);
  assert.match(source, /stepPresentationToNextChange/);
  assert.match(source, /layoutChanged: \(\) => this\.host\.requestRender\(\)/);
  assert.match(source, /for \(let frame = 0; frame < 240; frame \+= 1\)/);
  assert.match(source, /if \(!snapshot\.runtime\.animating\) break/);
  assert.match(source, /category: "input"/);
  assert.match(source, /recordWorldDeltas/);
  assert.match(source, /category: "motion"/);
  assert.match(source, /category: "lifecycle"/);
  assert.doesNotMatch(source, /presentationHz\s*=/);
  assert.doesNotMatch(source, /host\.close|close: \(\)/);
});
