import fs from 'node:fs';

function edit(path, transform) {
  const before = fs.readFileSync(path, 'utf8');
  const after = transform(before);
  if (after === before) throw new Error(`No change produced for ${path}`);
  fs.writeFileSync(path, after);
}
function replaceOnce(text, from, to, label) {
  const index = text.indexOf(from);
  if (index < 0) throw new Error(`Missing ${label}`);
  if (text.indexOf(from, index + from.length) >= 0) throw new Error(`Duplicate ${label}`);
  return text.slice(0, index) + to + text.slice(index + from.length);
}

edit('engine/src/mechanics/definitions.ts', (text) => {
  text = replaceOnce(text, "  markerBehavior,\n  passageBehavior,", "  markerBehavior,\n  passageBehavior,\n  preEnterBehavior,", 'preEnter import');
  text = replaceOnce(text, "    enterBehavior('mow-on-enter',", "    preEnterBehavior('mow-on-enter',", 'high grass pre-enter');
  text = replaceOnce(
    text,
    "export function runTerrainEnter(id:TerrainType,ctx:BehaviorRuntimeContext):boolean{for(const behavior of getTerrainDefinition(id).behaviors){if(behavior.onEnter?.(ctx)?.stop)return true;}return false;}",
    "export function runTerrainEnter(id:TerrainType,ctx:BehaviorRuntimeContext,phase:'before-object'|'after-object'='after-object'):boolean{for(const behavior of getTerrainDefinition(id).behaviors){if(!behavior.onEnter||(behavior.enterPhase??'after-object')!==phase)continue;if(behavior.onEnter(ctx)?.stop)return true;}return false;}",
    'terrain enter phase dispatcher'
  );
  return text;
});

edit('engine/src/world/World.ts', (text) => {
  text = replaceOnce(text, "  SPEED_TERRAIN_DIRECTION,\n", '', 'speed terrain import');
  text = replaceOnce(text, `import {\n  isCarousel,\n  isMirror,\n  isOrdinaryWalkableTerrain,\n  isWaterTerrain,\n  passageFor,\n  rotateCarousel,\n  rotateMirror,\n  toggleColorTerrain,\n  toggleSpeedTerrain,\n  toggleTideTerrain,\n  type PassageResult\n} from '../mechanics/rules.js';\n`, `import {\n  isOrdinaryWalkableTerrain,\n  isWaterTerrain,\n  passageFor,\n  type PassageResult\n} from '../mechanics/rules.js';\nimport {\n  inspectObjectDefinition,\n  inspectTerrainDefinition,\n  runObjectEnter,\n  runObjectLeave,\n  runTerrainEnter,\n  runTerrainLeave,\n  terrainHasTrait,\n  type TileDefinitionInspection\n} from '../mechanics/definitions.js';\nimport type { BehaviorRuntimeContext } from '../mechanics/behaviors.js';\n`, 'world mechanic imports');
  text = replaceOnce(text, `export interface TileInspection {\n  x: number;\n  y: number;\n  terrainType: TerrainType;\n  object: LevelObject | null;\n  objectType: ObjectType;\n  dynamicEntity: DynamicEntity | null;\n  isPlayer: boolean;\n  isStart: boolean;\n}\n`, `export interface TileInspection {\n  x: number;\n  y: number;\n  terrainType: TerrainType;\n  terrainDefinition: TileDefinitionInspection;\n  object: LevelObject | null;\n  objectType: ObjectType;\n  objectDefinition: TileDefinitionInspection;\n  dynamicEntity: DynamicEntity | null;\n  isPlayer: boolean;\n  isStart: boolean;\n}\n`, 'inspection definition fields');
  text = text.replace(/\nfunction pointEquals\([\s\S]*?\n}\n\nfunction copyPoint/, '\nfunction copyPoint');
  text = replaceOnce(text, `      terrainType,\n      object: objectType === EMPTY_OBJECT ? null : { type: objectType, x, y },\n      objectType,`, `      terrainType,\n      terrainDefinition: inspectTerrainDefinition(terrainType),\n      object: objectType === EMPTY_OBJECT ? null : { type: objectType, x, y },\n      objectType,\n      objectDefinition: inspectObjectDefinition(objectType),`, 'inspection registry payload');
  text = text.replace(/\n    if \(this\.objectIdAt\(to\.x, to\.y\) === ObjectId\.CRUMBLY_ROCK[\s\S]*?events\.push\(\{ type: 'break-rock', message: '高速割草机撞碎岩石', \.\.\.to \}\);\n    }\n/, '\n');

  const start = text.indexOf('  private beforeLeave(from: Point, events: WorldEvent[]): void {');
  const end = text.indexOf('  private afterEnterFlight(point: Point, direction: Direction, events: WorldEvent[]): void {');
  if (start < 0 || end < 0 || end <= start) throw new Error('World enter/leave block not found');
  const replacement = `  private behaviorContext(\n    point: Point,\n    direction: Direction,\n    events: WorldEvent[],\n    mode: 'normal' | 'flight',\n    justBoarded: boolean\n  ): BehaviorRuntimeContext {\n    const state = this.stateValue;\n    const terrainId = this.terrainAt(point.x, point.y)!;\n    const objectId = this.objectIdAt(point.x, point.y);\n    return {\n      state, direction, terrainId, objectId, x: point.x, y: point.y, mode, justBoarded,\n      api: {\n        setTerrain: (type) => this.setTerrain(point.x, point.y, type),\n        setObject: (type) => this.setObject(point.x, point.y, type),\n        mapTerrain: (mapper) => this.mapTerrain(mapper),\n        event: (type, message) => events.push({ type: type as WorldEvent['type'], message, ...point }),\n        kill: (reason) => this.kill(reason, events, point.x, point.y),\n        fireDragon: () => this.fireDragon(events),\n        propelClouds: () => this.propelCloudsByWind(events),\n        toggleWind: (index) => {\n          state.windmillsEnabled[index] = !state.windmillsEnabled[index];\n          this.toggleWindSwitchTiles(index);\n        },\n        mowedGround: () => GROUND_AFTER_MOW[(point.x * 17 + point.y * 31) & 3]!\n      }\n    };\n  }\n\n  private beforeLeave(from: Point, events: WorldEvent[]): void {\n    const state = this.stateValue;\n    if (state.previousCrumblingPlank && (state.previousCrumblingPlank.x !== from.x || state.previousCrumblingPlank.y !== from.y)) {\n      const old = state.previousCrumblingPlank;\n      const oldType = this.objectIdAt(old.x, old.y);\n      if (oldType === ObjectId.PLANK_CRUMBLING || oldType === ObjectId.PLANK_FRAGMENT) this.setObject(old.x, old.y, EMPTY_OBJECT);\n      state.previousCrumblingPlank = null;\n    }\n    const terrain = this.terrainAt(from.x, from.y)!;\n    const object = this.objectIdAt(from.x, from.y);\n    const ctx = this.behaviorContext(from, state.facing, events, 'normal', false);\n    runTerrainLeave(terrain, ctx);\n    runObjectLeave(object, ctx);\n  }\n\n  private afterEnter(point: Point, direction: Direction, events: WorldEvent[], options: { skipDynamic?: boolean; justBoarded?: boolean } = {}): void {\n    const state = this.stateValue;\n    const initialTerrain = this.terrainAt(point.x, point.y)!;\n    let ctx = this.behaviorContext(point, direction, events, 'normal', options.justBoarded === true);\n    if (runTerrainEnter(initialTerrain, ctx, 'before-object')) return;\n\n    const initialObject = this.objectIdAt(point.x, point.y);\n    runObjectEnter(initialObject, ctx);\n\n    const currentTerrain = this.terrainAt(point.x, point.y)!;\n    ctx = this.behaviorContext(point, direction, events, 'normal', options.justBoarded === true);\n    runTerrainEnter(currentTerrain, ctx, 'after-object');\n\n    const finalTerrain = this.terrainAt(point.x, point.y)!;\n    if ((state.forced?.kind === 'speed' || state.forced?.kind === 'ice') && !terrainHasTrait(finalTerrain, 'forced-movement')) state.forced = null;\n    if (!options.skipDynamic) this.propelCloudsByWind(events);\n  }\n\n`;
  text = text.slice(0, start) + replacement + text.slice(end);

  const flightStart = text.indexOf('  private afterEnterFlight(point: Point, direction: Direction, events: WorldEvent[]): void {');
  const flightEnd = text.indexOf('  private moveWithLeaf(', flightStart);
  if (flightStart < 0 || flightEnd < 0) throw new Error('afterEnterFlight block not found');
  const flightReplacement = `  private afterEnterFlight(point: Point, direction: Direction, events: WorldEvent[]): void {\n    const object = this.objectIdAt(point.x, point.y);\n    const ctx = this.behaviorContext(point, direction, events, 'flight', false);\n    runObjectEnter(object, ctx);\n    if (this.stateValue.forced === null) {\n      this.afterEnter(point, direction, events);\n      return;\n    }\n    this.stateValue.forced = { kind: 'flight', direction };\n  }\n\n`;
  text = text.slice(0, flightStart) + flightReplacement + text.slice(flightEnd);

  text = text.replace(/\n  private windSwitchIndex\(terrain: TerrainType\): number \| null \{[\s\S]*?\n  }\n\n  private toggleWindSwitchTiles/, '\n  private toggleWindSwitchTiles');
  return text;
});

edit('web/src/main.ts', (text) => {
  text = replaceOnce(text, '<div id="status" class="game-status">正在载入关卡…</div>', '<div id="status" class="game-status" hidden></div>', 'game status initial visibility');
  text = replaceOnce(text, `    debugPanel.classList.toggle('visible', activeGame.debug);\n    debugPanel.textContent = activeGame.debug ? (debugInspection ?? 'DEBUG\\n点击地图格查看详情') : '';\n    status.classList.remove('debug');\n    const move = activeGame.lastMove;\n    status.textContent = move ? \`${'${move.moved ? \'移动\' : \'阻挡\'} · ${move.passage.reason}'}\` : \`${'${displayLevelId(meta)} · 准备就绪'}\`;`, `    debugPanel.classList.toggle('visible', activeGame.debug);\n    const move = activeGame.lastMove;\n    const engineMessage = move ? \`${'${move.moved ? \'移动\' : \'阻挡\'} · ${move.passage.reason} [${move.passage.confidence}]'}\` : 'Engine: no passage yet';\n    debugPanel.textContent = activeGame.debug ? \`${'${debugInspection ?? \'DEBUG\\n点击地图格查看详情\'}\\n\\nENGINE MESSAGE\\n${engineMessage}'}\` : '';\n    status.classList.toggle('debug', activeGame.debug);\n    status.hidden = !activeGame.debug;\n    status.textContent = activeGame.debug ? engineMessage : '';`, 'debug-only engine message');

  const formatStart = text.indexOf('function formatTileInspection(tile: TileInspection, game: Game): string {');
  const formatEnd = text.indexOf('\nfunction bindMobileControls(game: Game): void {', formatStart);
  if (formatStart < 0 || formatEnd < 0) throw new Error('formatTileInspection block not found');
  const formatReplacement = `function formatTileInspection(tile: TileInspection, game: Game): string {\n  const world = game.world;\n  const dynamic = tile.dynamicEntity;\n  const formatDefinition = (label: string, definition: TileInspection['terrainDefinition']): string[] => {\n    const source = definition.source;\n    const lines = [\n      \`${'${label}: ${definition.id}'}\`,\n      \`  presentation: ${'${definition.presentation.name} / ${definition.presentation.category}'}\`,\n      \`  source: ${'${source?.datHexIds?.join(\', \') ?? \'n/a\'}'}${'${source ? ` [${source.confidence}]` : \'\'}'}\`,\n      \`  traits: ${'${definition.traits.length ? definition.traits.join(\', \') : \'none\'}'}\`,\n      '  behaviors:'\n    ];\n    if (!definition.behaviors.length) lines.push('    none');\n    for (const behavior of definition.behaviors) {\n      const config = behavior.config ? \` · ${'${Object.entries(behavior.config).map(([key, value]) => `${key}=${Array.isArray(value) ? value.join(\'|\') : value}`).join(\' · \')}'}\` : '';\n      lines.push(\`    ${'${behavior.id}'}${'${config}'}\`, \`      ${'${behavior.summary}'}\`);\n    }\n    return lines;\n  };\n  return [\n    \`Tile (${'${tile.x}'}, ${'${tile.y}'})\`,\n    ...formatDefinition('Terrain', tile.terrainDefinition),\n    '',\n    ...formatDefinition('Object', tile.objectDefinition),\n    '',\n    dynamic ? \`Dynamic: ${'${dynamic.type}'}\` : 'Dynamic: none',\n    dynamic ? \`  direction: ${'${dynamic.direction ?? \'none\'}'}\` : '',\n    dynamic ? \`  rider: ${'${dynamic.rider}'} · settled: ${'${dynamic.settled}'}\` : '',\n    dynamic ? \`  offsetPx: ${'${dynamic.offsetXpx}'}, ${'${dynamic.offsetYpx}'}\` : '',\n    \`Flags: player=${'${tile.isPlayer}'} · start=${'${tile.isStart}'}\`,\n    '',\n    \`Bobby: (${'${world.player.x}'}, ${'${world.player.y}'}) · facing=${'${world.facing}'}\`,\n    \`Forced: ${'${world.forcedKind ?? \'none\'}'} / ${'${world.forcedDirection ?? \'none\'}'}\`,\n    \`Mower: ${'${world.ridingMower}'}\`,\n    \`Objectives: ${'${world.objectiveRemaining}'}/${'${world.objectiveTotal}'}\`,\n    \`Moves: ${'${world.state.moves}'}\`,\n    \`Inventory: gas=${'${world.state.inventory.gas}'} kite=${'${world.state.inventory.kite}'} shovel=${'${world.state.inventory.shovel}'} beans=${'${world.state.inventory.beans}'}\`\n  ].filter(Boolean).join('\\n');\n}\n`;
  return text.slice(0, formatStart) + formatReplacement + text.slice(formatEnd);
});

edit('engine/src/index.ts', (text) => replaceOnce(text, `  directionalPassage,\n  rotateOnLeave,\n  passageBehavior,\n  markerBehavior,`, `  directionalPassage,\n  rotateOnLeave,\n  passageBehavior,\n  enterBehavior,\n  preEnterBehavior,\n  leaveBehavior,\n  markerBehavior,`, 'behavior exports'));

console.log('Applied composable behavior runtime migration.');
