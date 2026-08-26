import type { LevelMap, LevelObject, LevelObjectProperties, LevelObjectTraits, ObjectType, TerrainType } from "@bobby/model";
import { DIRECTIONS, EMPTY_OBJECT, ObjectId, Terrain, type Direction } from "../mechanics/ids.js";
import { isWaterTerrain, passageFor, type PassageResult } from "../mechanics/rules.js";
import {
  cloudGridForObject,
  inspectObjectDefinition,
  inspectTerrainDefinition,
  objectHasTrait,
  reflectFireForTerrain,
  runObjectEnter,
  runObjectLeave,
  runTerrainEnter,
  runTerrainLeave,
  terrainHasTrait,
  tideDirectionForTerrain,
  windmillInfoForObject,
  windSwitchIndexForTerrain,
  windSwitchPeerForTerrain,
  type TileDefinitionInspection,
} from "../mechanics/definitions.js";
import type { BehaviorRuntimeContext } from "../mechanics/behaviors.js";
import type { DynamicEntity, Point, ProfileCapabilities, RuntimeState, WorldSnapshot } from "./RuntimeState.js";
export type { Point, WorldSnapshot } from "./RuntimeState.js";
import type { MoveResult, TileInspection, WorldEvent } from "./WorldTypes.js";
import { copyPoint, emptyGrid, findFallbackStart, isOppositeDirection, isSameCell, statePoint } from "./world-grid.js";
import { deriveInitialObjectives } from "../mechanics/goals/objectives.js";
import { canPushObject, commitPushObject } from "../mechanics/movement/pushable.js";
import { commitActorMovement } from "../mechanics/movement/commit.js";
import { createActiveLevelRules, evaluateRulesAfterMove } from "../mechanics/rules/runtime.js";
import type { ActiveLevelRule } from "../mechanics/rules/types.js";
import { relocateToMatchingObject } from "../mechanics/interactions/relocation.js";
import { createBobbyState, updateBobbyProfile } from "../actors/bobby-state.js";
import { effectiveObjectHasTrait } from "../mechanics/traits/effective.js";
import { runtimeObject } from "./object-instance.js";
export type { MoveResult, TileInspection, WorldEvent } from "./WorldTypes.js";
const GROUND_AFTER_MOW = [Terrain.GROUND_A, Terrain.GROUND_B, Terrain.GROUND_C, Terrain.GROUND_D] as const;
export class World {
  readonly level: LevelMap;
  private readonly activeRules: ActiveLevelRule[];
  private stateValue: RuntimeState;
  constructor(level: LevelMap, profile: Partial<ProfileCapabilities> = {}) {
    this.level = level;
    this.activeRules = createActiveLevelRules(level);
    this.stateValue = this.createInitialState(level, profile);
  }
  get state(): Readonly<RuntimeState> {
    return this.stateValue;
  }
  get player(): Point {
    return this.stateValue.player;
  }
  get width(): number {
    return this.level.width;
  }
  get height(): number {
    return this.level.height;
  }
  get startPosition(): Point {
    return copyPoint(this.stateValue.start);
  }
  get objectiveRemaining(): number {
    return this.stateValue.objectiveRemaining;
  }
  get objectiveTotal(): number {
    return this.stateValue.objectiveTotal;
  }
  get ridingMower(): boolean {
    return this.stateValue.ridingMower;
  }
  get dead(): boolean {
    return this.stateValue.dead;
  }
  get completed(): boolean {
    return this.stateValue.completed;
  }
  get facing(): Direction {
    return this.stateValue.facing;
  }
  get forcedDirection(): Direction | null {
    return this.stateValue.forced?.direction ?? null;
  }
  get forcedKind(): string | null {
    return this.stateValue.forced?.kind ?? null;
  }
  get isPlayerClimbing(): boolean {
    return objectHasTrait(
      this.objectIdAt(this.stateValue.player.x, this.stateValue.player.y),
      "climbable",
    );
  }
  getRiddenDynamicEntity(): DynamicEntity | null {
    return (
      this.stateValue.dynamicEntities.find(
        (entity) =>
          entity.rider &&
          isSameCell(
            entity,
            this.stateValue.player.x,
            this.stateValue.player.y,
          ),
      ) ?? null
    );
  }
  advanceTime(deltaMs: number): WorldEvent[] {
    if (
      !Number.isFinite(deltaMs) ||
      deltaMs <= 0 ||
      this.stateValue.dead ||
      this.stateValue.completed
    )
      return [];
    const events: WorldEvent[] = [];
    this.stateValue.logicRemainderMs += deltaMs;
    while (this.stateValue.logicRemainderMs >= 62) {
      this.stateValue.logicRemainderMs -= 62;
      this.advanceOriginalLogicTick(events);
    }
    return events;
  }
  killPlayer(reason: string): WorldEvent[] {
    if (this.stateValue.dead || this.stateValue.completed) return [];
    const events: WorldEvent[] = [];
    this.kill(
      reason,
      events,
      this.stateValue.player.x,
      this.stateValue.player.y,
    );
    return events;
  }
  clearTransientEffects(): void {
    this.stateValue.fireTrail = [];
  }
  snapshot(): WorldSnapshot {
    return structuredClone(this.stateValue);
  }
  restore(snapshot: WorldSnapshot): void {
    this.stateValue = structuredClone(snapshot);
  }
  setProfile(profile: Partial<ProfileCapabilities>): void {
    updateBobbyProfile(this.stateValue, profile);
  }
  terrainAt(x: number, y: number): TerrainType | null {
    if (!this.inBounds(x, y)) return null;
    return this.stateValue.terrain[y]?.[x] ?? null;
  }
  objectIdAt(x: number, y: number): ObjectType {
    if (!this.inBounds(x, y)) return EMPTY_OBJECT;
    return this.stateValue.objects[y]?.[x] ?? EMPTY_OBJECT;
  }
  objectsAt(x: number, y: number): LevelObject[] {
    const type = this.objectIdAt(x, y);
    const properties = this.objectPropertiesAt(x, y);
    const traits = this.inBounds(x, y)
      ? this.stateValue.objectTraits[y]?.[x]
      : undefined;
    return runtimeObject(type, x, y, traits, properties);
  }
  objectPropertiesAt(x: number, y: number): LevelObjectProperties | undefined {
    if (!this.inBounds(x, y)) return undefined;
    return this.stateValue.objectProperties[y]?.[x];
  }
  dynamicEntityAt(x: number, y: number): DynamicEntity | null {
    return (
      this.stateValue.dynamicEntities.find((entity) =>
        isSameCell(entity, x, y),
      ) ?? null
    );
  }
  getDynamicEntities(): readonly DynamicEntity[] {
    return this.stateValue.dynamicEntities;
  }
  move(direction: Direction, forced = false): MoveResult {
    const state = this.stateValue,
      from = copyPoint(state.player),
      events: WorldEvent[] = [];
    if (state.dead || state.completed)
      return this.result(
        false,
        from,
        from,
        {
          passable: false,
          reason: state.dead ? "Bobby 已失败" : "关卡已完成",
          confidence: "confirmed",
        },
        events,
      );
    const vector = DIRECTIONS[direction],
      to = { x: from.x + vector.dx, y: from.y + vector.dy };
    const ridden = state.dynamicEntities.find(
      (entity) => entity.rider && isSameCell(entity, from.x, from.y),
    );
    if (ridden && objectHasTrait(ridden.type, "dynamic-leaf"))
      return this.moveWithLeaf(ridden, direction, from, to, events, forced);
    if (ridden && objectHasTrait(ridden.type, "dynamic-cloud")) {
      const passage = this.passageTo(from, to, direction);
      if (!passage.passable)
        return this.result(false, from, to, passage, events);
      ridden.rider = false;
      this.beforeLeave(from, events);
      commitActorMovement(state, to, direction, forced);
      this.applyPassageSideEffects(passage, to, events);
      this.afterEnter(to, direction, events);
      this.applySuccessfulMoveRules(forced, events);
      return this.result(true, from, to, passage, events);
    }
    if (!this.inBounds(to.x, to.y)) {
      if (state.forced?.kind === "flight")
        this.kill("风筝飞出了地图边界", events, from.x, from.y);
      else state.forced = null;
      return this.result(
        false,
        from,
        to,
        { passable: false, reason: "地图边界", confidence: "confirmed" },
        events,
      );
    }
    if (state.forced?.kind === "flight") {
      this.beforeLeave(from, events);
      state.player = to;
      state.position = to;
      state.facing = direction;
      this.afterEnterFlight(to, direction, events);
      return this.result(
        true,
        from,
        to,
        { passable: true, reason: "风筝飞行", confidence: "confirmed" },
        events,
      );
    }
    const dynamicTarget = this.dynamicEntityAt(to.x, to.y);
    if (dynamicTarget) {
      const staticObject = this.objectIdAt(to.x, to.y);
      if (
        staticObject !== EMPTY_OBJECT &&
        staticObject !== ObjectId.CLOUD_GRID_RED &&
        staticObject !== ObjectId.CLOUD_GRID_PURPLE &&
        staticObject !== ObjectId.CLOUD_GRID_GREEN
      )
        return this.result(
          false,
          from,
          to,
          {
            passable: false,
            reason: "动态载具所在格还有阻挡对象",
            confidence: "inferred",
          },
          events,
        );
      this.beforeLeave(from, events);
      commitActorMovement(state, to, direction, forced);
      dynamicTarget.rider = true;
      if (dynamicTarget.type === ObjectId.LEAF) {
        const underlyingTerrain = this.terrainAt(to.x, to.y),
          tideDirection = underlyingTerrain
            ? tideDirectionForTerrain(underlyingTerrain)
            : undefined;
        if (tideDirection && isOppositeDirection(tideDirection, direction)) {
          dynamicTarget.settled = true;
          dynamicTarget.direction = null;
          state.forced = null;
        } else {
          dynamicTarget.settled = false;
          dynamicTarget.direction = tideDirection ?? direction;
          state.forced = {
            kind: "leaf",
            direction: tideDirection ?? direction,
          };
        }
      }
      this.afterEnter(to, direction, events, { skipDynamic: true });
      this.applySuccessfulMoveRules(forced, events);
      return this.result(
        true,
        from,
        to,
        { passable: true, reason: "踏上动态载具", confidence: "confirmed" },
        events,
      );
    }
    const targetObject = this.objectIdAt(to.x, to.y);
    if (
      effectiveObjectHasTrait(
        targetObject,
        state.objectTraits[to.y]?.[to.x],
        "pushable",
      )
    ) {
      const pushedTo = { x: to.x + vector.dx, y: to.y + vector.dy };
      if (!canPushObject(state, this.level, to, pushedTo))
        return this.result(
          false,
          from,
          to,
          {
            passable: false,
            reason: "石头后方没有可推动空间",
            confidence: "confirmed",
          },
          events,
        );
      const pushPassage = this.passageTo(from, to, direction, EMPTY_OBJECT);
      if (!pushPassage.passable)
        return this.result(false, from, to, pushPassage, events);
      commitPushObject(state, this.level, to, pushedTo);
      events.push({
        type: "object-interaction",
        objectType: targetObject,
        action: "push",
        message: "推动对象",
        ...pushedTo,
      });
    }
    const passage = this.passageTo(from, to, direction);
    if (!passage.passable) {
      if (forced) state.forced = null;
      return this.result(false, from, to, passage, events);
    }
    this.beforeLeave(from, events);
    commitActorMovement(state, to, direction, forced);
    this.applyPassageSideEffects(passage, to, events);
    this.afterEnter(to, direction, events, {
      justBoarded: passage.boardsMower === true,
    });
    this.applySuccessfulMoveRules(forced, events);
    return this.result(true, from, to, passage, events);
  }
  inspect(x: number, y: number): TileInspection | null {
    const terrainType = this.terrainAt(x, y);
    if (terrainType === null) return null;
    const objectType = this.objectIdAt(x, y);
    const objectProperties = this.objectPropertiesAt(x, y);
    return {
      x,
      y,
      terrainType,
      terrainDefinition: inspectTerrainDefinition(terrainType),
      object:
        objectType === EMPTY_OBJECT
          ? null
          : {
              type: objectType,
              x,
              y,
              ...(objectProperties ? { properties: objectProperties } : {}),
            },
      objectType,
      objectDefinition: inspectObjectDefinition(objectType),
      dynamicEntity: this.dynamicEntityAt(x, y),
      isPlayer: statePoint(this.stateValue.player, x, y),
      isStart: statePoint(this.stateValue.start, x, y),
    };
  }
  private createInitialState(
    level: LevelMap,
    profile: Partial<ProfileCapabilities>,
  ): RuntimeState {
    const terrain = level.terrain.map((row) => [...row]),
      objects = emptyGrid<ObjectType>(level.width, level.height, EMPTY_OBJECT),
      objectProperties = emptyGrid<LevelObjectProperties | undefined>(
        level.width,
        level.height,
        undefined,
      ),
      objectTraits = emptyGrid<LevelObjectTraits | undefined>(
        level.width,
        level.height,
        undefined,
      ),
      dynamicEntities: DynamicEntity[] = [];
    let start: Point | null = null;
    for (let y = 0; y < level.height; y++)
      for (let x = 0; x < level.width; x++)
        if (terrain[y]?.[x] && terrainHasTrait(terrain[y]![x]!, "start"))
          start = { x, y };
    for (const sourceObject of level.objects) {
      const { type, x, y } = sourceObject;
      if (objectHasTrait(type, "dynamic")) {
        dynamicEntities.push({
          type,
          x,
          y,
          direction: null,
          rider: false,
          settled: false,
          offsetXpx: 0,
          offsetYpx: 0,
        });
        continue;
      }
      objects[y]![x] = type;
      objectProperties[y]![x] = sourceObject.properties
        ? { ...sourceObject.properties }
        : undefined;
      objectTraits[y]![x] = sourceObject.traits
        ? [...sourceObject.traits]
        : undefined;
    }
    if (!start) start = findFallbackStart(terrain);
    const objectives = deriveInitialObjectives(terrain, objects, objectTraits);
    const windmillsEnabled: [boolean, boolean, boolean, boolean] = [
        false,
        false,
        false,
        false,
      ],
      hasSwitch: [boolean, boolean, boolean, boolean] = [
        false,
        false,
        false,
        false,
      ];
    for (const row of terrain)
      for (const type of row) {
        const index = windSwitchIndexForTerrain(type);
        if (index !== undefined) {
          hasSwitch[index] = true;
          if (type.endsWith("-on")) windmillsEnabled[index] = true;
        }
      }
    for (const row of objects)
      for (const type of row) {
        const info = windmillInfoForObject(type);
        if (info && !hasSwitch[info.index]) windmillsEnabled[info.index] = true;
      }
    return {
      ...createBobbyState(start, profile),
      terrain,
      objects,
      objectProperties,
      objectTraits,
      dynamicEntities,
      start: copyPoint(start),
      objectiveMode: objectives.mode,
      objectiveRemaining: objectives.remaining,
      objectiveTotal: objectives.total,
      pushGoalsRemaining: objectives.pushGoalsRemaining,
      ...(level.rules?.win ? { winCondition: structuredClone(level.rules.win) } : {}),
      forced: null,
      pendingTrap: null,
      pendingCarousel: null,
      pendingMirror: null,
      pendingNest: null,
      pendingPlank: null,
      previousCrumblingPlank: null,
      windmillsEnabled,
      beanstalkGrowth: [],
      logicRemainderMs: 0,
      bonusCoinsInLevel: 0,
      goldenCarrotsInLevel: 0,
      deathReason: null,
      completed: false,
      fireTrail: [],
      warnings: [],
    };
  }
  private passageTo(
    from: Point,
    to: Point,
    direction: Direction,
    objectOverride?: ObjectType,
  ): PassageResult {
    if (!this.inBounds(to.x, to.y))
      return { passable: false, reason: "地图边界", confidence: "confirmed" };
    return passageFor(
      this.stateValue,
      from.x,
      from.y,
      to.x,
      to.y,
      direction,
      this.terrainAt(to.x, to.y)!,
      objectOverride ?? this.objectIdAt(to.x, to.y),
    );
  }
  private applyPassageSideEffects(
    passage: PassageResult,
    to: Point,
    events: WorldEvent[],
  ): void {
    if (passage.consumesLock) {
      this.setObject(to.x, to.y, EMPTY_OBJECT);
      if (!this.stateValue.profile.superKey)
        this.stateValue.profile.temporaryKey = false;
      events.push({
        type: "object-interaction",
        objectType: ObjectId.LOCK,
        action: "open",
        message: "打开对象",
        ...to,
      });
    }
    if (passage.clearsSnow) {
      this.setTerrain(to.x, to.y, Terrain.GROUND_D);
      events.push({ type: "toggle-switch", message: "雪铲清除了雪堆", ...to });
    }
    if (passage.boardsMower) {
      this.setObject(to.x, to.y, EMPTY_OBJECT);
      this.stateValue.ridingMower = true;
      events.push({ type: "board-mower", message: "登上割草机", ...to });
    }
    if (passage.startsFlight)
      this.stateValue.forced = {
        kind: "flight",
        direction: this.stateValue.facing,
      };
  }
  private behaviorContext(
    point: Point,
    direction: Direction,
    events: WorldEvent[],
    mode: "normal" | "flight",
    justBoarded: boolean,
  ): BehaviorRuntimeContext {
    const state = this.stateValue,
      terrainId = this.terrainAt(point.x, point.y)!,
      objectId = this.objectIdAt(point.x, point.y);
    return {
      state,
      direction,
      terrainId,
      objectId,
      x: point.x,
      y: point.y,
      mode,
      justBoarded,
      api: {
        setTerrain: (type) => this.setTerrain(point.x, point.y, type),
        setObject: (type) => this.setObject(point.x, point.y, type),
        mapTerrain: (mapper) => this.mapTerrain(mapper),
        event: (type, message) =>
          events.push({ type: type as WorldEvent["type"], message, ...point }),
        kill: (reason) => this.kill(reason, events, point.x, point.y),
        fireDragon: () => this.fireDragon(events),
        propelClouds: () => this.propelCloudsByWind(events),
        toggleWind: (index) => {
          state.windmillsEnabled[index] = !state.windmillsEnabled[index];
          this.toggleWindSwitchTiles(index);
        },
        mowedGround: () => GROUND_AFTER_MOW[(point.x * 17 + point.y * 31) & 3]!,
        relocateToMatchingObject: (type, propertyKey) =>
          relocateToMatchingObject(
            this.stateValue,
            this.level,
            point,
            type,
            propertyKey,
          ),
        objectInteraction: (objectType, action, message, target = point) =>
          events.push({
            type: "object-interaction",
            objectType,
            action,
            message,
            ...target,
          }),
      },
    };
  }
  private beforeLeave(from: Point, events: WorldEvent[]): void {
    const state = this.stateValue;
    if (
      state.previousCrumblingPlank &&
      (state.previousCrumblingPlank.x !== from.x ||
        state.previousCrumblingPlank.y !== from.y)
    ) {
      const old = state.previousCrumblingPlank,
        oldType = this.objectIdAt(old.x, old.y);
      if (
        oldType === ObjectId.PLANK_CRUMBLING ||
        oldType === ObjectId.PLANK_FRAGMENT
      )
        this.setObject(old.x, old.y, EMPTY_OBJECT);
      state.previousCrumblingPlank = null;
    }
    const terrain = this.terrainAt(from.x, from.y)!,
      object = this.objectIdAt(from.x, from.y),
      ctx = this.behaviorContext(from, state.facing, events, "normal", false);
    runTerrainLeave(terrain, ctx);
    runObjectLeave(object, ctx);
  }
  private afterEnter(
    point: Point,
    direction: Direction,
    events: WorldEvent[],
    options: { skipDynamic?: boolean; justBoarded?: boolean } = {},
  ): void {
    const state = this.stateValue,
      initialTerrain = this.terrainAt(point.x, point.y)!;
    let ctx = this.behaviorContext(
      point,
      direction,
      events,
      "normal",
      options.justBoarded === true,
    );
    if (runTerrainEnter(initialTerrain, ctx, "before-object")) return;
    const initialObject = this.objectIdAt(point.x, point.y);
    runObjectEnter(initialObject, ctx);
    const currentTerrain = this.terrainAt(point.x, point.y)!;
    ctx = this.behaviorContext(
      point,
      direction,
      events,
      "normal",
      options.justBoarded === true,
    );
    runTerrainEnter(currentTerrain, ctx, "after-object");
    const finalTerrain = this.terrainAt(point.x, point.y)!;
    if (
      (state.forced?.kind === "speed" || state.forced?.kind === "ice") &&
      !terrainHasTrait(finalTerrain, "forced-movement")
    )
      state.forced = null;
    if (!options.skipDynamic) this.propelCloudsByWind(events);
  }
  private afterEnterFlight(
    point: Point,
    direction: Direction,
    events: WorldEvent[],
  ): void {
    const object = this.objectIdAt(point.x, point.y),
      ctx = this.behaviorContext(point, direction, events, "flight", false);
    runObjectEnter(object, ctx);
    if (this.stateValue.forced === null) {
      this.afterEnter(point, direction, events);
      return;
    }
    this.stateValue.forced = { kind: "flight", direction };
  }
  private moveWithLeaf(
    entity: DynamicEntity,
    direction: Direction,
    from: Point,
    to: Point,
    events: WorldEvent[],
    forced: boolean,
  ): MoveResult {
    const state = this.stateValue;
    if (!this.inBounds(to.x, to.y)) {
      state.forced = null;
      entity.settled = true;
      return this.result(
        false,
        from,
        to,
        {
          passable: false,
          reason: "荷叶到达地图边界并停住",
          confidence: "confirmed",
        },
        events,
      );
    }
    const terrain = this.terrainAt(to.x, to.y)!,
      dynamicTarget = this.dynamicEntityAt(to.x, to.y),
      object = this.objectIdAt(to.x, to.y);
    if (
      !entity.settled &&
      isWaterTerrain(terrain) &&
      !dynamicTarget &&
      object === EMPTY_OBJECT
    ) {
      const tideDirection = tideDirectionForTerrain(terrain);
      if (tideDirection && isOppositeDirection(tideDirection, direction)) {
        state.forced = null;
        entity.settled = true;
        entity.direction = null;
        return this.result(
          false,
          from,
          to,
          {
            passable: false,
            reason: "荷叶遇到反向潮汐并停住",
            confidence: "confirmed",
          },
          events,
        );
      }
      entity.x = to.x;
      entity.y = to.y;
      entity.direction = tideDirection ?? direction;
      state.player = to;
      state.position = to;
      state.facing = direction;
      state.forced = { kind: "leaf", direction: tideDirection ?? direction };
      return this.result(
        true,
        from,
        to,
        {
          passable: true,
          reason: tideDirection ? "荷叶受潮汐推动" : "荷叶继续漂流",
          confidence: "confirmed",
        },
        events,
      );
    }
    const passage = this.passageTo(from, to, direction);
    if (passage.passable && forced) {
      state.forced = null;
      entity.settled = true;
      entity.direction = null;
      return this.result(
        false,
        from,
        to,
        { passable: false, reason: "荷叶靠岸并停住", confidence: "confirmed" },
        events,
      );
    }
    if (passage.passable) {
      entity.rider = false;
      state.forced = null;
      entity.direction = null;
      this.beforeLeave(from, events);
      commitActorMovement(state, to, direction, forced);
      this.applyPassageSideEffects(passage, to, events);
      this.afterEnter(to, direction, events);
      this.applySuccessfulMoveRules(forced, events);
      return this.result(true, from, to, passage, events);
    }
    state.forced = null;
    entity.settled = true;
    entity.direction = null;
    return this.result(
      false,
      from,
      to,
      {
        passable: false,
        reason: "荷叶撞到障碍并停住；需先下叶再重新登上",
        confidence: "confirmed",
      },
      events,
    );
  }
  private advanceOriginalLogicTick(events: WorldEvent[]): void {
    this.propelCloudsByWind(events);
    this.advanceCloudMotion(events);
    const growth = this.stateValue.beanstalkGrowth;
    for (let index = growth.length - 1; index >= 0; index--) {
      const item = growth[index]!;
      if (item.ticksUntilGrowth > 0) {
        item.ticksUntilGrowth--;
        continue;
      }
      const targetY = item.baseY - item.stage,
        targetTerrain = this.terrainAt(item.x, targetY),
        canGrow =
          this.inBounds(item.x, targetY) &&
          this.objectIdAt(item.x, targetY) === EMPTY_OBJECT &&
          targetTerrain !== null &&
          terrainHasTrait(targetTerrain, "beanstalk-growth");
      if (!canGrow) {
        growth.splice(index, 1);
        continue;
      }
      this.setObject(
        item.x,
        item.baseY - item.stage + 1,
        ObjectId.BEANSTALK_MID,
      );
      if (item.stage <= 1)
        this.setObject(item.x, item.baseY, ObjectId.BEANSTALK_BASE);
      this.setObject(item.x, targetY, ObjectId.BEANSTALK_TIP);
      item.stage++;
      item.ticksUntilGrowth = 16;
      events.push({
        type: "beanstalk-grow",
        message: "藤蔓向上生长一格",
        x: item.x,
        y: targetY,
      });
    }
  }
  private fireDragon(events: WorldEvent[]): void {
    const state = this.stateValue;
    let head: Point | null = null;
    outer: for (let y = 0; y < this.height; y++)
      for (let x = 0; x < this.width; x++)
        if (objectHasTrait(this.objectIdAt(x, y), "dragon-head")) {
          head = { x, y };
          break outer;
        }
    if (!head) return;
    let direction: Direction = "left",
      x = head.x - 1,
      y = head.y;
    const trail: Point[] = [],
      seen = new Set<string>();
    for (let step = 0; step < this.width * this.height * 2; step++) {
      if (!this.inBounds(x, y)) break;
      const key = `${x},${y},${direction}`;
      if (seen.has(key)) break;
      seen.add(key);
      trail.push({ x, y });
      const terrain = this.terrainAt(x, y)!,
        object = this.objectIdAt(x, y);
      if (objectHasTrait(object, "dragon-fire-melt")) {
        this.setObject(x, y, EMPTY_OBJECT);
        events.push({ type: "melt-ice", message: "龙火融化冰块", x, y });
      } else if (objectHasTrait(object, "dragon-fire-blocking")) break;
      const reflected = reflectFireForTerrain(terrain, direction);
      if (reflected === false) break;
      if (reflected) direction = reflected;
      else if (!terrainHasTrait(terrain, "dragon-fire-passable")) break;
      const vector = DIRECTIONS[direction];
      x += vector.dx;
      y += vector.dy;
    }
    state.fireTrail = trail;
    events.push({
      type: "dragon-fire",
      message: `龙喷火经过 ${trail.length} 格`,
      x: head.x,
      y: head.y,
    });
  }
  private propelCloudsByWind(events: WorldEvent[]): void {
    const state = this.stateValue,
      windmills: Array<{
        x: number;
        y: number;
        direction: Direction;
        enabled: boolean;
      }> = [];
    for (let y = 0; y < this.height; y++)
      for (let x = 0; x < this.width; x++) {
        const info = windmillInfoForObject(this.objectIdAt(x, y));
        if (info)
          windmills.push({
            x,
            y,
            direction: info.direction,
            enabled: state.windmillsEnabled[info.index]!,
          });
      }
    for (const entity of state.dynamicEntities) {
      if (!objectHasTrait(entity.type, "dynamic-cloud")) continue;
      const wind = windmills.find(
        (candidate) =>
          candidate.enabled &&
          this.isInWindTunnel(
            entity.x,
            entity.y,
            candidate.x,
            candidate.y,
            candidate.direction,
          ),
      );
      if (wind) entity.direction = wind.direction;
    }
    void events;
  }
  private advanceCloudMotion(events: WorldEvent[]): void {
    const state = this.stateValue,
      tilePx = 48;
    for (const entity of state.dynamicEntities) {
      if (!objectHasTrait(entity.type, "dynamic-cloud") || !entity.direction)
        continue;
      const vector = DIRECTIONS[entity.direction],
        speed = entity.rider ? 6 : 3;
      entity.offsetXpx += vector.dx * speed;
      entity.offsetYpx += vector.dy * speed;
      const crossed =
        Math.abs(entity.offsetXpx) >= tilePx ||
        Math.abs(entity.offsetYpx) >= tilePx;
      if (!crossed) continue;
      const nx = entity.x + vector.dx,
        ny = entity.y + vector.dy;
      if (!this.canDynamicEntityOccupy(entity, nx, ny)) {
        entity.direction = null;
        entity.offsetXpx = 0;
        entity.offsetYpx = 0;
        continue;
      }
      entity.x = nx;
      entity.y = ny;
      entity.offsetXpx -= vector.dx * tilePx;
      entity.offsetYpx -= vector.dy * tilePx;
      if (entity.rider) {
        state.player = { x: nx, y: ny };
        state.position = { x: nx, y: ny };
      }
      const ownGrid = cloudGridForObject(entity.type);
      if (ownGrid !== undefined && this.objectIdAt(nx, ny) === ownGrid) {
        entity.direction = null;
        entity.offsetXpx = 0;
        entity.offsetYpx = 0;
      }
    }
    void events;
  }
  private isInWindTunnel(
    x: number,
    y: number,
    wx: number,
    wy: number,
    direction: Direction,
  ): boolean {
    const vector = DIRECTIONS[direction];
    for (let distance = 1; distance <= 3; distance++)
      if (wx + vector.dx * distance === x && wy + vector.dy * distance === y)
        return true;
    return false;
  }
  private canDynamicEntityOccupy(
    entity: DynamicEntity,
    x: number,
    y: number,
  ): boolean {
    if (!this.inBounds(x, y) || this.dynamicEntityAt(x, y)) return false;
    const object = this.objectIdAt(x, y),
      ownGrid = cloudGridForObject(entity.type);
    if (object !== EMPTY_OBJECT && object !== ownGrid) return false;
    return terrainHasTrait(this.terrainAt(x, y)!, "cloud-passable");
  }
  private toggleWindSwitchTiles(index: number): void {
    this.mapTerrain((type) =>
      windSwitchIndexForTerrain(type) === index
        ? (windSwitchPeerForTerrain(type) ?? type)
        : type,
    );
  }
  private mapTerrain(mapper: (type: TerrainType) => TerrainType): void {
    for (let y = 0; y < this.height; y++)
      for (let x = 0; x < this.width; x++)
        this.stateValue.terrain[y]![x] = mapper(
          this.stateValue.terrain[y]![x]!,
        );
  }
  private setTerrain(x: number, y: number, type: TerrainType): void {
    if (this.inBounds(x, y)) this.stateValue.terrain[y]![x] = type;
  }
  private setObject(x: number, y: number, type: ObjectType): void {
    if (!this.inBounds(x, y)) return;
    this.stateValue.objects[y]![x] = type;
    if (type === EMPTY_OBJECT) {
      this.stateValue.objectProperties[y]![x] = undefined;
      this.stateValue.objectTraits[y]![x] = undefined;
    }
  }
  private applySuccessfulMoveRules(forced: boolean, events: WorldEvent[]): void {
    if (this.stateValue.completed) return;
    const reason = evaluateRulesAfterMove(
      this.activeRules,
      this.stateValue,
      forced,
    );
    if (reason)
      this.kill(
        reason,
        events,
        this.stateValue.player.x,
        this.stateValue.player.y,
      );
  }
  private kill(
    reason: string,
    events: WorldEvent[],
    x: number,
    y: number,
  ): void {
    const state = this.stateValue;
    state.dead = true;
    state.deathReason = reason;
    state.forced = null;
    events.push({ type: "death", message: reason, x, y });
  }
  private inBounds(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.width && y < this.height;
  }
  private result(
    moved: boolean,
    from: Point,
    to: Point,
    passage: PassageResult,
    events: WorldEvent[],
  ): MoveResult {
    const forced = this.stateValue.forced;
    return {
      moved,
      from,
      to,
      passage,
      events,
      forcedDirection: forced?.direction ?? null,
      forcedKind: forced?.kind ?? null,
      dead: this.stateValue.dead,
      completed: this.stateValue.completed,
    };
  }
}
