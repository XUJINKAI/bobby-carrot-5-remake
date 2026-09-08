import type { ImageManager } from "@bobby/engine";
import type {
  MapCollectionFilter,
  MapCollectionIcon,
  MapCollectionIndex,
  MapCollectionMap,
} from "../../services/catalog/catalog.js";
import {
  entityVisualStyle,
  styleRecordToText,
} from "../../services/assets/entityVisual.js";

const selected = new Map<string, Set<string>>();
let activePanel: string | null = null;
let currentCollection: MapCollectionIndex | null = null;
let currentImages: ImageManager | null = null;

export function mountLevelFilters(
  collection: MapCollectionIndex,
  images: ImageManager,
): void {
  currentCollection = collection;
  currentImages = images;
  const validGroups = new Set(collection.filters.map((filter) => filter.id));
  for (const group of [...selected.keys()]) {
    if (!validGroups.has(group)) selected.delete(group);
  }
  for (const filter of collection.filters) {
    if (!selected.has(filter.id)) selected.set(filter.id, new Set());
  }
  if (activePanel && !validGroups.has(activePanel)) activePanel = null;

  const head = document.querySelector<HTMLElement>(".level-browser-head");
  if (!head) return;
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
  return [...selected.values()].some((values) => values.size > 0);
}

export function randomFilteredMap(): MapCollectionMap | undefined {
  if (!currentCollection) return undefined;
  const candidates = currentCollection.maps.filter(mapMatchesCurrent);
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function renderFilterShell(shell: HTMLElement): void {
  if (!currentCollection) return;
  const total = [...selected.values()].reduce(
    (sum, values) => sum + values.size,
    0,
  );
  const toolbar = currentCollection.filters
    .map((filter) => filterTrigger(filter))
    .join("");
  const panels = currentCollection.filters
    .map((filter) => filterPanel(filter))
    .join("");
  shell.innerHTML = `<div class="level-filter-toolbar"><span class="level-filter-label">筛选</span>${toolbar}<span class="level-filter-spacer"></span><button class="level-filter-clear" data-filter-clear ${total ? "" : "hidden"}>清除筛选</button></div>${panels}<div class="level-filter-status muted" data-filter-status></div>`;
}

function filterTrigger(filter: MapCollectionFilter): string {
  const count = selected.get(filter.id)?.size ?? 0;
  const classes = [
    "level-filter-trigger",
    activePanel === filter.id ? "open" : "",
    count ? "active" : "",
  ]
    .filter(Boolean)
    .join(" ");
  return `<button class="${classes}" data-filter-trigger="${escapeAttribute(filter.id)}" aria-expanded="${activePanel === filter.id}">${escapeHtml(filter.name)}${count ? `<span class="level-filter-count">${count}</span>` : ""}</button>`;
}

function filterPanel(filter: MapCollectionFilter): string {
  const values = selected.get(filter.id) ?? new Set<string>();
  const options = filter.options
    .map((option) => {
      const selectedClass = values.has(option.id) ? " selected" : "";
      return `<button class="level-filter-option${selectedClass}" data-filter-group="${escapeAttribute(filter.id)}" data-filter-option="${escapeAttribute(option.id)}" aria-pressed="${values.has(option.id)}">${iconHtml(option.icon)}<span>${escapeHtml(option.name)}</span></button>`;
    })
    .join("");
  return `<div class="level-filter-panel" data-filter-panel="${escapeAttribute(filter.id)}" ${activePanel === filter.id ? "" : "hidden"}>${options}</div>`;
}

function onFilterClick(event: Event): void {
  const target = event.target as HTMLElement;
  const trigger = target.closest<HTMLButtonElement>("[data-filter-trigger]");
  if (trigger) {
    const group = trigger.dataset.filterTrigger;
    if (!group) return;
    activePanel = activePanel === group ? null : group;
    rerender(trigger);
    return;
  }
  const option = target.closest<HTMLButtonElement>("[data-filter-option]");
  if (option) {
    const group = option.dataset.filterGroup;
    const id = option.dataset.filterOption;
    if (!group || !id) return;
    const values = selected.get(group);
    const filter = currentCollection?.filters.find(
      (candidate) => candidate.id === group,
    );
    if (!values || !filter) return;
    toggleLevelFilterOption(values, filter, id);
    rerender(option);
    return;
  }
  if (target.closest("[data-filter-clear]")) {
    for (const values of selected.values()) values.clear();
    activePanel = null;
    rerender(target);
  }
}

function rerender(target: HTMLElement): void {
  const shell = target.closest<HTMLElement>(".level-filter-shell");
  if (shell) renderFilterShell(shell);
  applyFilters();
}

function applyFilters(): void {
  if (!currentCollection) return;
  const active = hasActiveLevelFilters();
  const byId = new Map(currentCollection.maps.map((map) => [map.id, map]));
  let visibleMaps = 0;
  for (const element of document.querySelectorAll<HTMLElement>("[data-map-id]")) {
    const id = element.dataset.mapId;
    const map = id ? byId.get(id) : undefined;
    const matches = !active || Boolean(map && mapMatchesCurrent(map));
    element.classList.toggle("filter-hidden", !matches);
    if (matches) visibleMaps++;
  }
  for (const chapter of document.querySelectorAll<HTMLElement>(".chapter-card")) {
    const maps = [...chapter.querySelectorAll<HTMLElement>("[data-map-id]")];
    const count = maps.filter(
      (map) => !map.classList.contains("filter-hidden"),
    ).length;
    const hidden = active && count === 0;
    chapter.classList.toggle("filter-hidden", hidden);
    setText(
      chapter.querySelector(".chapter-count"),
      active ? `${count} / ${maps.length} 关` : `${maps.length} 关`,
    );
  }
  setText(
    document.querySelector("[data-filter-status]"),
    active
      ? `匹配 ${visibleMaps} 张地图；已选条件需同时满足。`
      : "萝卜数单选；其余筛选可多选，已选条件需同时满足。",
  );
  let empty = document.querySelector<HTMLElement>(".level-filter-empty");
  if (active && visibleMaps === 0) {
    if (!empty) {
      empty = document.createElement("div");
      empty.className = "level-filter-empty";
      empty.textContent = "没有符合这些条件的地图。";
      document.querySelector(".explore-page")?.append(empty);
    }
  } else {
    empty?.remove();
  }
}

function mapMatchesCurrent(map: MapCollectionMap): boolean {
  return mapMatchesLevelFilters(map, selected);
}

export function mapMatchesLevelFilters(
  map: MapCollectionMap,
  filters: ReadonlyMap<string, ReadonlySet<string>>,
): boolean {
  for (const [group, wanted] of filters) {
    if (wanted.size === 0) continue;
    const values = map.filters?.[group] ?? [];
    if (![...wanted].every((value) => values.includes(value))) return false;
  }
  return true;
}

export function toggleLevelFilterOption(
  values: Set<string>,
  filter: MapCollectionFilter,
  optionId: string,
): void {
  if (values.has(optionId)) {
    values.delete(optionId);
    return;
  }
  if (filter.selection === "single") values.clear();
  values.add(optionId);
}

function iconHtml(icon: MapCollectionIcon | undefined): string {
  if (!icon) return "";
  if (icon.type === "text") {
    return `<span class="level-filter-icon" aria-hidden="true">${escapeHtml(icon.value)}</span>`;
  }
  if (icon.type === "image") {
    if (!currentImages) return "";
    const id = `collection-icon:${icon.src}`;
    currentImages.registerSource(id, new URL(icon.src, document.baseURI).href);
    return `<img class="level-filter-icon" aria-hidden="true" src="${escapeAttribute(currentImages.url(id))}">`;
  }
  const style = currentImages
    ? entityVisualStyle(currentImages, icon.entity, 24)
    : null;
  if (style) {
    return `<i class="level-filter-icon" aria-hidden="true" style="${escapeAttribute(styleRecordToText(style))}"></i>`;
  }
  const glyph = entityGlyph(icon.entity.type);
  return `<span class="level-filter-icon" aria-hidden="true" title="${escapeAttribute(icon.entity.type)}">${escapeHtml(glyph)}</span>`;
}

function entityGlyph(type: string): string {
  return (
    type
      .split("-")
      .filter(Boolean)
      .map((part) => part[0] ?? "")
      .join("")
      .slice(0, 2)
      .toUpperCase() || "·"
  );
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
