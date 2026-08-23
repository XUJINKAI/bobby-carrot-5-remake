import { Game, InputController } from '/engine/index.js';

const $ = (selector) => document.querySelector(selector);
const canvas = $('#game');
const levelSelect = $('#level');
const inspector = $('#inspector');
const state = $('#state');
const debug = $('#debug');
const zoomLabel = $('#zoom');

const catalog = await fetch('/assets/catalog.json').then((r) => r.json());
for (const item of catalog.levels) {
  const option = document.createElement('option');
  option.value = item.id;
  option.textContent = `#${item.id} · ${item.width}×${item.height} · ${item.sources.map((s) => `${s.edition}/${s.packFile}:${s.levelIndex}`).join(', ')}`;
  levelSelect.append(option);
}

const params = new URLSearchParams(location.search);
const initial = params.get('level')?.padStart(3, '0') ?? '001';
levelSelect.value = catalog.levels.some((level) => level.id === initial) ? initial : '001';
debug.checked = params.get('debug') === '1';

const game = new Game({
  canvas,
  assets: {
    atlasUrl: '/assets/art/hd/ts.png',
    animationAtlasUrl: '/assets/art/hd/ta.png',
    bobbyUrls: {
      left: '/assets/art/hd/b0.png',
      right: '/assets/art/hd/b1.png',
      up: '/assets/art/hd/b2.png',
      down: '/assets/art/hd/b3.png'
    },
    mowerBobbyUrl: '/assets/art/hd/b7.png',
    kiteUrl: '/assets/art/hd/b9.png',
    sourceTileSize: 48
  },
  debug: debug.checked
});
new InputController(game);

async function load(id) {
  const level = await fetch(`/assets/levels/${id}.json`).then((r) => r.json());
  await game.loadLevel(level);
  const url = new URL(location.href);
  url.searchParams.set('level', id);
  if (game.debug) url.searchParams.set('debug', '1'); else url.searchParams.delete('debug');
  history.replaceState(null, '', url);
  updateState();
}

function updateState() {
  if (!game.hasLevel) return;
  zoomLabel.textContent = `${Math.round(game.zoom * 100)}%`;
  state.textContent = JSON.stringify({
    level: game.world.level.id,
    size: `${game.world.width}×${game.world.height}`,
    player: game.world.player,
    start: game.world.startPosition,
    zoom: Number(game.zoom.toFixed(2)),
    lastMove: game.lastMove?.passage ?? null
  }, null, 2);
}

game.on('change', updateState);
levelSelect.addEventListener('change', () => void load(levelSelect.value));
$('#prev').addEventListener('click', () => {
  const index = Math.max(0, catalog.levels.findIndex((level) => level.id === levelSelect.value) - 1);
  levelSelect.value = catalog.levels[index].id; void load(levelSelect.value);
});
$('#next').addEventListener('click', () => {
  const index = Math.min(catalog.levels.length - 1, catalog.levels.findIndex((level) => level.id === levelSelect.value) + 1);
  levelSelect.value = catalog.levels[index].id; void load(levelSelect.value);
});
$('#undo').addEventListener('click', () => game.undo());
$('#restart').addEventListener('click', () => game.restart());
$('#zoom-in').addEventListener('click', () => game.zoomBy(1.1));
$('#zoom-out').addEventListener('click', () => game.zoomBy(1 / 1.1));
debug.addEventListener('change', () => {
  game.setDebug(debug.checked);
  const url = new URL(location.href);
  if (game.debug) url.searchParams.set('debug', '1'); else url.searchParams.delete('debug');
  history.replaceState(null, '', url);
});
canvas.addEventListener('click', (event) => {
  if (!game.debug) return;
  const tile = game.inspectCanvasPoint(event.clientX, event.clientY);
  inspector.textContent = tile ? JSON.stringify(tile, null, 2) : 'Outside map.';
});

await load(levelSelect.value);
