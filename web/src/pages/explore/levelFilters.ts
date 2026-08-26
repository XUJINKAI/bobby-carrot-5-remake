import {
  ObjectId,
  Terrain,
  objectAtlasCell,
  terrainAtlasCell,
  type ObjectType,
  type TerrainType,
} from "@bobby/engine";
import {
  type CatalogLevel,
  type LevelCatalog,
} from "../../services/catalog/catalog.js";
type FilterGroup = "carrots" | "items" | "scenes" | "mechanics";
interface LevelFilterFeatures {
  carrotCount: number;
  specialItems: string[];
  scenes: string[];
  mechanics: string[];
}
interface FilterOption {
  id: string;
  label: string;
  icon?: string;
}
const GROUP_LABELS: Record<FilterGroup, string> = {
  carrots: "萝卜数",
  items: "特殊道具",
  scenes: "场景",
  mechanics: "机关",
};
const selected: Record<FilterGroup, Set<string>> = {
  carrots: new Set(),
  items: new Set(),
  scenes: new Set(),
  mechanics: new Set(),
};
let activePanel: FilterGroup | null = null,
  currentCatalog: LevelCatalog | null = null;
const atlasUrl = new URL("assets/art/hd/ts.png", document.baseURI).href;
const OPTIONS: Record<FilterGroup, FilterOption[]> = {
  carrots: [
    { id: "0", label: "0", icon: objectIcon(ObjectId.CARROT) },
    { id: "1-5", label: "1–5", icon: objectIcon(ObjectId.CARROT) },
    { id: "6-10", label: "6–10", icon: objectIcon(ObjectId.CARROT) },
    { id: "11-20", label: "11–20", icon: objectIcon(ObjectId.CARROT) },
    { id: "21+", label: "21+", icon: objectIcon(ObjectId.CARROT) },
  ],
  items: [
    { id: "shovel", label: "雪铲", icon: terrainIcon(Terrain.SHOVEL_PICKUP) },
    { id: "mower", label: "割草机", icon: objectIcon(ObjectId.MOWER) },
    { id: "gas", label: "汽油", icon: objectIcon(ObjectId.GAS) },
    { id: "bean", label: "魔豆", icon: objectIcon(ObjectId.BEAN) },
    { id: "kite", label: "风筝", icon: objectIcon(ObjectId.KITE) },
    {
      id: "golden-carrot",
      label: "金胡萝卜",
      icon: objectIcon(ObjectId.GOLDEN_CARROT),
    },
    {
      id: "bonus-coin",
      label: "Bonus Coin",
      icon: objectIcon(ObjectId.BONUS_COIN),
    },
  ],
  scenes: [
    { id: "grassland", label: "草地", icon: terrainIcon(Terrain.GROUND_C) },
    { id: "water", label: "水域", icon: terrainIcon(Terrain.WATER_ANIMATED) },
    { id: "snow", label: "雪地", icon: terrainIcon(Terrain.SNOW) },
    { id: "ice", label: "冰面", icon: terrainIcon(Terrain.ICE) },
    { id: "high-grass", label: "高草", icon: terrainIcon(Terrain.HIGH_GRASS) },
    { id: "shop", label: "商店", icon: terrainIcon(Terrain.SHOP_DREAM) },
  ],
  mechanics: [
    { id: "tide", label: "潮汐", icon: terrainIcon(Terrain.TIDE_RIGHT) },
    { id: "speed", label: "加速带", icon: terrainIcon(Terrain.SPEED_RIGHT) },
    {
      id: "carousel",
      label: "旋转通道",
      icon: terrainIcon(Terrain.CAROUSEL_1),
    },
    {
      id: "wind",
      label: "风车 / 云",
      icon: objectIcon(ObjectId.WINDMILL_RIGHT),
    },
    { id: "mirror", label: "魔法镜", icon: terrainIcon(Terrain.MIRROR_1) },
    { id: "trap", label: "陷阱", icon: terrainIcon(Terrain.TRAP_ACTIVE) },
    {
      id: "color-switch",
      label: "彩色开关",
      icon: terrainIcon(Terrain.COLOR_YELLOW_SWITCH_RAISED),
    },
    { id: "mower", label: "割草机", icon: objectIcon(ObjectId.MOWER) },
    {
      id: "beanstalk",
      label: "魔豆藤",
      icon: objectIcon(ObjectId.BEANSTALK_TIP),
    },
    { id: "dragon", label: "龙", icon: objectIcon(ObjectId.DRAGON_HEAD_BASE) },
    {
      id: "beaver",
      label: "海狸 / 锁",
      icon: objectIcon(ObjectId.BEAVER_BASE),
    },
    {
      id: "dream",
      label: "梦境机关",
      icon: objectIcon(ObjectId.DREAM_MACHINE),
    },
    { id: "plank", label: "木板", icon: objectIcon(ObjectId.PLANK) },
    {
      id: "whirlwind",
      label: "龙卷风 / 风筝",
      icon: objectIcon(ObjectId.WHIRLWIND),
    },
    { id: "ice-block", label: "冰块", icon: objectIcon(ObjectId.ICE_BLOCK) },
  ],
};
export async function mountLevelFilters(catalog: LevelCatalog): Promise<void> {
  currentCatalog = catalog;
  const head = document.querySelector<HTMLElement>(".level-browser-head"),
    chapterList = document.querySelector<HTMLElement>(".chapter-list");
  if (!head || !chapterList) return;
  document.querySelector(".level-filter-shell")?.remove();
  const shell = document.createElement("section");
  shell.className = "level-filter-shell";
  shell.setAttribute("aria-label", "关卡筛选");
  head.insertAdjacentElement("afterend", shell);
  shell.addEventListener("click", onFilterClick);
  renderFilterShell(shell);
  applyFilters();
}
export function hasActiveLevelFilters(): boolean {
  return filterGroups().some((g) => selected[g].size > 0);
}
export function randomFilteredLevel(): CatalogLevel | undefined {
  if (!currentCatalog) return undefined;
  const candidates = currentCatalog.levels.filter(levelMatchesCurrent);
  return candidates[Math.floor(Math.random() * candidates.length)];
}
function renderFilterShell(shell: HTMLElement): void {
  const total = filterGroups().reduce((sum, g) => sum + selected[g].size, 0);
  shell.innerHTML = `<div class="level-filter-toolbar"><span class="level-filter-label">筛选</span>${filterGroups()
    .map((g) => {
      const count = selected[g].size;
      return `<button class="level-filter-trigger ${activePanel === g ? "open" : ""} ${count ? "active" : ""}" data-filter-trigger="${g}" aria-expanded="${activePanel === g}">${GROUP_LABELS[g]}${count ? `<span class="level-filter-count">${count}</span>` : ""}</button>`;
    })
    .join(
      "",
    )}<span class="level-filter-spacer"></span><button class="level-filter-clear" data-filter-clear ${total ? "" : "hidden"}>清除筛选</button></div>${filterGroups()
    .map(
      (g) =>
        `<div class="level-filter-panel" data-filter-panel="${g}" ${activePanel === g ? "" : "hidden"}>${OPTIONS[g].map((o) => `<button class="level-filter-option ${selected[g].has(o.id) ? "selected" : ""}" data-filter-group="${g}" data-filter-option="${o.id}">${o.icon ?? ""}<span>${escapeHtml(o.label)}</span></button>`).join("")}</div>`,
    )
    .join("")}<div class="level-filter-status muted" data-filter-status></div>`;
}
function onFilterClick(event: Event): void {
  const target = event.target as HTMLElement,
    trigger = target.closest<HTMLButtonElement>("[data-filter-trigger]");
  if (trigger) {
    const g = trigger.dataset.filterTrigger as FilterGroup;
    activePanel = activePanel === g ? null : g;
    const shell = trigger.closest<HTMLElement>(".level-filter-shell");
    if (shell) renderFilterShell(shell);
    applyFilters();
    return;
  }
  const option = target.closest<HTMLButtonElement>("[data-filter-option]");
  if (option) {
    const g = option.dataset.filterGroup as FilterGroup,
      id = option.dataset.filterOption;
    if (!id) return;
    const set = selected[g];
    if (set.has(id)) set.delete(id);
    else set.add(id);
    const shell = option.closest<HTMLElement>(".level-filter-shell");
    if (shell) renderFilterShell(shell);
    applyFilters();
    return;
  }
  if (target.closest("[data-filter-clear]")) {
    for (const g of filterGroups()) selected[g].clear();
    activePanel = null;
    const shell = target.closest<HTMLElement>(".level-filter-shell");
    if (shell) renderFilterShell(shell);
    applyFilters();
  }
}
function applyFilters(): void {
  if (!currentCatalog) return;
  const active = hasActiveLevelFilters(),
    byId = new Map<string, CatalogLevel>(
      currentCatalog.levels.map((level) => [level.publicId, level]),
    );
  let visibleLevels = 0;
  for (const anchor of document.querySelectorAll<HTMLAnchorElement>(
    ".chapter-level[href]",
  )) {
    const id = anchor.dataset.levelId,
      level = id ? byId.get(id) : undefined,
      matches = !active || Boolean(level && levelMatchesCurrent(level));
    anchor.classList.toggle("filter-hidden", !matches);
    if (matches) visibleLevels++;
  }
  let visibleChapters = 0;
  for (const chapter of document.querySelectorAll<HTMLElement>(
    ".chapter-card",
  )) {
    const levels = [...chapter.querySelectorAll<HTMLElement>(".chapter-level")],
      count = levels.filter(
        (level) => !level.classList.contains("filter-hidden"),
      ).length,
      hidden = active && count === 0;
    chapter.classList.toggle("filter-hidden", hidden);
    if (!hidden) visibleChapters++;
    setText(
      chapter.querySelector(".chapter-count"),
      active ? `${count} / ${levels.length} 关` : `${levels.length} 关`,
    );
  }
  setText(
    document.querySelector(".level-browser-summary"),
    active
      ? `${visibleChapters} / ${currentCatalog.chapters.length} 章 · ${visibleLevels} / ${currentCatalog.levels.length} 关`
      : `${currentCatalog.chapters.length} 章 · ${currentCatalog.levels.length} 关`,
  );
  setText(
    document.querySelector("[data-filter-status]"),
    active
      ? `匹配 ${visibleLevels} 关；同一类别内满足任一条件，不同类别需同时满足。`
      : "同一类别内为“或”，不同类别之间为“且”。",
  );
  let empty = document.querySelector<HTMLElement>(".level-filter-empty");
  if (active && visibleLevels === 0) {
    if (!empty) {
      empty = document.createElement("div");
      empty.className = "level-filter-empty";
      empty.textContent = "没有符合这些条件的关卡。";
      document
        .querySelector(".chapter-list")
        ?.insertAdjacentElement("afterend", empty);
    }
  } else empty?.remove();
}
function levelMatchesCurrent(level: CatalogLevel): boolean {
  return levelMatches(level, level);
}
function levelMatches(level: CatalogLevel, f: LevelFilterFeatures): boolean {
  if (
    selected.carrots.size &&
    ![...selected.carrots].some((range) =>
      carrotRangeMatches(f.carrotCount, range),
    )
  )
    return false;
  if (selected.items.size && !f.specialItems.some((v) => selected.items.has(v)))
    return false;
  if (selected.scenes.size && !f.scenes.some((v) => selected.scenes.has(v)))
    return false;
  if (
    selected.mechanics.size &&
    !f.mechanics.some((v) => selected.mechanics.has(v))
  )
    return false;
  return true;
}
function carrotRangeMatches(count: number, range: string): boolean {
  return range === "0"
    ? count === 0
    : range === "1-5"
      ? count >= 1 && count <= 5
      : range === "6-10"
        ? count >= 6 && count <= 10
        : range === "11-20"
          ? count >= 11 && count <= 20
          : range === "21+"
            ? count >= 21
            : false;
}
function filterGroups(): FilterGroup[] {
  return ["carrots", "items", "scenes", "mechanics"];
}
function terrainIcon(type: TerrainType): string {
  return atlasIcon(terrainAtlasCell(type));
}
function objectIcon(type: ObjectType): string {
  return atlasIcon(objectAtlasCell(type));
}
function atlasIcon(cell: { column: number; row: number }): string {
  const size = 24;
  return `<i class="level-filter-icon" aria-hidden="true" style="background-image:url('${escapeAttribute(atlasUrl)}');background-size:${16 * size}px ${16 * size}px;background-position:${-cell.column * size}px ${-cell.row * size}px"></i>`;
}
function setText(element: HTMLElement | null, value: string): void {
  if (element && element.textContent !== value) element.textContent = value;
}
function escapeHtml(value: string): string {
  return value.replace(
    /[&<>\"]/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '\"': "&quot;" })[char] ??
      char,
  );
}
function escapeAttribute(value: string): string {
  return escapeHtml(value).replaceAll("'", "&#39;");
}
