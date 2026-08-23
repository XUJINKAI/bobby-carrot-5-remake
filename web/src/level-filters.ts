import {
  ObjectId,
  Terrain,
  objectAtlasCell,
  terrainAtlasCell,
  type CatalogLevel,
  type LevelCatalog,
  type ObjectType,
  type TerrainType
} from '@bobby/engine';

type FilterGroup = 'difficulty' | 'carrots' | 'items' | 'scenes' | 'mechanics';

interface LevelFilterFeatures {
  carrotCount: number;
  specialItems: string[];
  scenes: string[];
  mechanics: string[];
}

interface LevelFilterIndex {
  schemaVersion: 1;
  generatedFromCatalogSchema: number;
  levelCount: number;
  levels: Record<string, LevelFilterFeatures>;
}

interface FilterOption {
  id: string;
  label: string;
  icon?: string;
}

const GROUP_LABELS: Record<FilterGroup, string> = {
  difficulty: '难度',
  carrots: '萝卜数',
  items: '特殊道具',
  scenes: '场景',
  mechanics: '机关'
};

const selected: Record<FilterGroup, Set<string>> = {
  difficulty: new Set(),
  carrots: new Set(),
  items: new Set(),
  scenes: new Set(),
  mechanics: new Set()
};

let activePanel: FilterGroup | null = null;
let scheduled = false;
let catalog: LevelCatalog | null = null;
let filterIndex: LevelFilterIndex | null = null;
let loadPromise: Promise<void> | null = null;

const atlasUrl = new URL('assets/art/hd/ts.png', document.baseURI).href;

const OPTIONS: Record<FilterGroup, FilterOption[]> = {
  difficulty: [
    { id: 'tutorial', label: '教学', icon: '<i class="difficulty-dot tutorial"></i>' },
    { id: 'easy', label: '简单', icon: '<i class="difficulty-dot easy"></i>' },
    { id: 'medium', label: '中等', icon: '<i class="difficulty-dot medium"></i>' },
    { id: 'hard', label: '困难', icon: '<i class="difficulty-dot hard"></i>' }
  ],
  carrots: [
    { id: '0', label: '0', icon: objectIcon(ObjectId.CARROT) },
    { id: '1-5', label: '1–5', icon: objectIcon(ObjectId.CARROT) },
    { id: '6-10', label: '6–10', icon: objectIcon(ObjectId.CARROT) },
    { id: '11-20', label: '11–20', icon: objectIcon(ObjectId.CARROT) },
    { id: '21+', label: '21+', icon: objectIcon(ObjectId.CARROT) }
  ],
  items: [
    { id: 'shovel', label: '雪铲', icon: terrainIcon(Terrain.SHOVEL_PICKUP) },
    { id: 'mower', label: '割草机', icon: objectIcon(ObjectId.MOWER) },
    { id: 'gas', label: '汽油', icon: objectIcon(ObjectId.GAS) },
    { id: 'bean', label: '魔豆', icon: objectIcon(ObjectId.BEAN) },
    { id: 'kite', label: '风筝', icon: objectIcon(ObjectId.KITE) },
    { id: 'golden-carrot', label: '金胡萝卜', icon: objectIcon(ObjectId.GOLDEN_CARROT) },
    { id: 'bonus-coin', label: 'Bonus Coin', icon: objectIcon(ObjectId.BONUS_COIN) }
  ],
  scenes: [
    { id: 'grassland', label: '草地', icon: terrainIcon(Terrain.GROUND_C) },
    { id: 'water', label: '水域', icon: terrainIcon(Terrain.WATER_ANIMATED) },
    { id: 'snow', label: '雪地', icon: terrainIcon(Terrain.SNOW) },
    { id: 'ice', label: '冰面', icon: terrainIcon(Terrain.ICE) },
    { id: 'high-grass', label: '高草', icon: terrainIcon(Terrain.HIGH_GRASS) },
    { id: 'shop', label: '商店', icon: terrainIcon(Terrain.SHOP_DREAM) }
  ],
  mechanics: [
    { id: 'tide', label: '潮汐', icon: terrainIcon(Terrain.TIDE_RIGHT) },
    { id: 'speed', label: '加速带', icon: terrainIcon(Terrain.SPEED_RIGHT) },
    { id: 'carousel', label: '旋转通道', icon: terrainIcon(Terrain.CAROUSEL_1) },
    { id: 'wind', label: '风车 / 云', icon: objectIcon(ObjectId.WINDMILL_RIGHT) },
    { id: 'mirror', label: '魔法镜', icon: terrainIcon(Terrain.MIRROR_1) },
    { id: 'trap', label: '陷阱', icon: terrainIcon(Terrain.TRAP_ACTIVE) },
    { id: 'color-switch', label: '彩色开关', icon: terrainIcon(Terrain.COLOR_YELLOW_SWITCH_RAISED) },
    { id: 'mower', label: '割草机', icon: objectIcon(ObjectId.MOWER) },
    { id: 'beanstalk', label: '魔豆藤', icon: objectIcon(ObjectId.BEANSTALK_TIP) },
    { id: 'dragon', label: '龙', icon: objectIcon(ObjectId.DRAGON_HEAD_BASE) },
    { id: 'beaver', label: '海狸 / 锁', icon: objectIcon(ObjectId.BEAVER_BASE) },
    { id: 'dream', label: '梦境机关', icon: objectIcon(ObjectId.DREAM_MACHINE) },
    { id: 'plank', label: '木板', icon: objectIcon(ObjectId.PLANK) },
    { id: 'whirlwind', label: '龙卷风 / 风筝', icon: objectIcon(ObjectId.WHIRLWIND) },
    { id: 'ice-block', label: '冰块', icon: objectIcon(ObjectId.ICE_BLOCK) }
  ]
};

const app = document.querySelector<HTMLElement>('#app');
if (app) {
  const observer = new MutationObserver(() => {
    // 只在主 SPA 重新渲染出选关页、而筛选壳尚未重新挂载时触发。
    // 筛选 UI 自己更新 innerHTML 时不重复调度，避免 observer 自激循环。
    if (document.querySelector('.release-tabs') && !document.querySelector('.level-filter-shell')) scheduleEnhance();
  });
  observer.observe(app, { childList: true, subtree: true });
  scheduleEnhance();
  document.addEventListener('click', interceptFilteredRandom, true);
}

function scheduleEnhance(): void {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => {
    scheduled = false;
    void enhanceLevelBrowser();
  });
}

async function enhanceLevelBrowser(): Promise<void> {
  const releaseTabs = document.querySelector<HTMLElement>('.release-tabs');
  const chapterList = document.querySelector<HTMLElement>('.chapter-list');
  if (!releaseTabs || !chapterList) return;

  await loadData();
  if (!catalog || !filterIndex) return;
  if (!document.querySelector('.release-tabs') || !document.querySelector('.chapter-list')) return;

  let shell = document.querySelector<HTMLElement>('.level-filter-shell');
  if (!shell) {
    shell = document.createElement('section');
    shell.className = 'level-filter-shell';
    shell.setAttribute('aria-label', '关卡筛选');
    releaseTabs.insertAdjacentElement('afterend', shell);
    shell.addEventListener('click', onFilterClick);
  }
  renderFilterShell(shell);
  applyFilters();
}

async function loadData(): Promise<void> {
  if (catalog && filterIndex) return;
  if (!loadPromise) {
    loadPromise = Promise.all([
      fetch(new URL('assets/catalog.json', document.baseURI)).then((response) => {
        if (!response.ok) throw new Error(`catalog ${response.status}`);
        return response.json() as Promise<LevelCatalog>;
      }),
      fetch(new URL('assets/level-filters.json', document.baseURI)).then((response) => {
        if (!response.ok) throw new Error(`level filters ${response.status}`);
        return response.json() as Promise<LevelFilterIndex>;
      })
    ]).then(([nextCatalog, nextFilters]) => {
      catalog = nextCatalog;
      filterIndex = nextFilters;
    }).catch((error) => {
      console.error('关卡筛选索引加载失败', error);
    });
  }
  await loadPromise;
}

function renderFilterShell(shell: HTMLElement): void {
  const totalSelected = filterGroups().reduce((sum, group) => sum + selected[group].size, 0);
  shell.innerHTML = `
    <div class="level-filter-toolbar">
      <span class="level-filter-label">筛选</span>
      ${filterGroups().map((group) => {
        const count = selected[group].size;
        return `<button class="level-filter-trigger ${activePanel === group ? 'open' : ''} ${count ? 'active' : ''}" data-filter-trigger="${group}" aria-expanded="${activePanel === group}">
          ${GROUP_LABELS[group]}${count ? `<span class="level-filter-count">${count}</span>` : ''}
        </button>`;
      }).join('')}
      <span class="level-filter-spacer"></span>
      <button class="level-filter-clear" data-filter-clear ${totalSelected ? '' : 'hidden'}>清除筛选</button>
    </div>
    ${filterGroups().map((group) => `
      <div class="level-filter-panel" data-filter-panel="${group}" ${activePanel === group ? '' : 'hidden'}>
        ${OPTIONS[group].map((option) => `<button class="level-filter-option ${selected[group].has(option.id) ? 'selected' : ''}" data-filter-group="${group}" data-filter-option="${option.id}">
          ${option.icon ?? ''}<span>${escapeHtml(option.label)}</span>
        </button>`).join('')}
      </div>`).join('')}
    <div class="level-filter-status muted" data-filter-status></div>`;
}

function onFilterClick(event: Event): void {
  const target = event.target as HTMLElement;
  const trigger = target.closest<HTMLButtonElement>('[data-filter-trigger]');
  if (trigger) {
    const group = trigger.dataset.filterTrigger as FilterGroup;
    activePanel = activePanel === group ? null : group;
    const shell = trigger.closest<HTMLElement>('.level-filter-shell');
    if (shell) renderFilterShell(shell);
    applyFilters();
    return;
  }

  const option = target.closest<HTMLButtonElement>('[data-filter-option]');
  if (option) {
    const group = option.dataset.filterGroup as FilterGroup;
    const id = option.dataset.filterOption;
    if (!id) return;
    const set = selected[group];
    if (set.has(id)) set.delete(id); else set.add(id);
    const shell = option.closest<HTMLElement>('.level-filter-shell');
    if (shell) renderFilterShell(shell);
    applyFilters();
    return;
  }

  if (target.closest('[data-filter-clear]')) {
    for (const group of filterGroups()) selected[group].clear();
    activePanel = null;
    const shell = target.closest<HTMLElement>('.level-filter-shell');
    if (shell) renderFilterShell(shell);
    applyFilters();
  }
}

function applyFilters(): void {
  if (!catalog || !filterIndex) return;
  const active = hasActiveFilters();
  const levelByPublicId = new Map(catalog.levels.map((level) => [level.publicId, level]));
  const anchors = [...document.querySelectorAll<HTMLAnchorElement>('.chapter-level[href]')];
  let visibleLevels = 0;

  for (const anchor of anchors) {
    const publicId = publicIdFromHref(anchor.getAttribute('href') ?? '');
    const level = publicId ? levelByPublicId.get(publicId) : undefined;
    const features = publicId ? filterIndex.levels[publicId] : undefined;
    const matches = !active || Boolean(level && features && levelMatches(level, features));
    anchor.classList.toggle('filter-hidden', !matches);
    if (matches) visibleLevels += 1;
  }

  let visibleChapters = 0;
  for (const chapter of document.querySelectorAll<HTMLElement>('.chapter-card')) {
    const chapterLevels = [...chapter.querySelectorAll<HTMLElement>('.chapter-level')];
    const count = chapterLevels.filter((level) => !level.classList.contains('filter-hidden')).length;
    const hidden = active && count === 0;
    chapter.classList.toggle('filter-hidden', hidden);
    if (!hidden) visibleChapters += 1;
    const countLabel = chapter.querySelector<HTMLElement>('.chapter-head .muted');
    const next = active ? `${count} / ${chapterLevels.length} 关` : `${chapterLevels.length} 关`;
    setText(countLabel, next);
  }

  const release = document.querySelector<HTMLButtonElement>('.release-tab.active[data-release]');
  const releaseId = release?.dataset.release;
  const releaseInfo = releaseId ? catalog.releases.find((item) => item.id === releaseId) : undefined;
  const summary = document.querySelector<HTMLElement>('.release-summary .muted');
  if (releaseInfo && summary) {
    const chapterCount = catalog.chapters.filter((chapter) => chapter.release === releaseInfo.id).length;
    setText(summary, active ? `${visibleChapters} / ${chapterCount} 个章节 · ${visibleLevels} / ${releaseInfo.levelCount} 关` : `${chapterCount} 个章节 · ${releaseInfo.levelCount} 关`);
  }

  const status = document.querySelector<HTMLElement>('[data-filter-status]');
  if (status) setText(status, active ? `当前发行包匹配 ${visibleLevels} 关；同一类别内满足任一条件，不同类别需同时满足。` : '同一类别内为“或”，不同类别之间为“且”。');

  const chapterList = document.querySelector<HTMLElement>('.chapter-list');
  if (chapterList) {
    let empty = document.querySelector<HTMLElement>('.level-filter-empty');
    if (active && visibleLevels === 0) {
      if (!empty) {
        empty = document.createElement('div');
        empty.className = 'level-filter-empty';
        empty.textContent = '当前发行包没有符合这些条件的关卡。';
        chapterList.insertAdjacentElement('afterend', empty);
      }
    } else {
      empty?.remove();
    }
  }
}

function levelMatches(level: CatalogLevel, features: LevelFilterFeatures): boolean {
  if (selected.difficulty.size && !selected.difficulty.has(level.difficulty.level)) return false;
  if (selected.carrots.size && ![...selected.carrots].some((range) => carrotRangeMatches(features.carrotCount, range))) return false;
  if (selected.items.size && !features.specialItems.some((item) => selected.items.has(item))) return false;
  if (selected.scenes.size && !features.scenes.some((scene) => selected.scenes.has(scene))) return false;
  if (selected.mechanics.size && !features.mechanics.some((mechanic) => selected.mechanics.has(mechanic))) return false;
  return true;
}

function carrotRangeMatches(count: number, range: string): boolean {
  if (range === '0') return count === 0;
  if (range === '1-5') return count >= 1 && count <= 5;
  if (range === '6-10') return count >= 6 && count <= 10;
  if (range === '11-20') return count >= 11 && count <= 20;
  if (range === '21+') return count >= 21;
  return false;
}

function interceptFilteredRandom(event: Event): void {
  if (!hasActiveFilters()) return;
  const target = event.target as HTMLElement;
  const random = target.closest<HTMLButtonElement>('#random-level');
  if (!random || random.disabled) return;
  const candidates = [...document.querySelectorAll<HTMLAnchorElement>('.chapter-level:not(.filter-hidden)[href]')];
  if (!candidates.length) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  const chosen = candidates[Math.floor(Math.random() * candidates.length)];
  chosen?.click();
}

function publicIdFromHref(href: string): string | null {
  const match = /(?:^|\/)play\/([^/?#]+)/.exec(href);
  return match ? decodeURIComponent(match[1]!) : null;
}

function hasActiveFilters(): boolean {
  return filterGroups().some((group) => selected[group].size > 0);
}

function filterGroups(): FilterGroup[] {
  return ['difficulty', 'carrots', 'items', 'scenes', 'mechanics'];
}

function terrainIcon(type: TerrainType): string { return atlasIcon(terrainAtlasCell(type)); }
function objectIcon(type: ObjectType): string { return atlasIcon(objectAtlasCell(type)); }
function atlasIcon(cell: { column: number; row: number }): string {
  const size = 24;
  return `<i class="level-filter-icon" aria-hidden="true" style="background-image:url('${escapeAttribute(atlasUrl)}');background-size:${16 * size}px ${16 * size}px;background-position:${-cell.column * size}px ${-cell.row * size}px"></i>`;
}

function setText(element: HTMLElement | null, value: string): void {
  if (element && element.textContent !== value) element.textContent = value;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>\"]/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '\"':'&quot;' })[char] ?? char);
}
function escapeAttribute(value: string): string { return escapeHtml(value).replaceAll("'", '&#39;'); }
