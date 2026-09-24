import type { FocusGroup, FocusPlan } from "./focusPlans.js";

export function isAvailableFocusTarget(element: HTMLElement): boolean {
  return element.isConnected && !element.matches(":disabled, [aria-disabled='true']") &&
    !element.closest("[hidden], [inert], [aria-hidden='true']") &&
    element.getClientRects().length > 0 && getComputedStyle(element).visibility !== "hidden";
}

/** 页面焦点只来自配置，DOM 顺序仅用于同一组内部排序。 */
export class FocusRegion {
  private readonly selected = new Map<string, HTMLElement>();

  constructor(readonly root: HTMLElement, readonly plan: FocusPlan) {}

  elements(group: FocusGroup): HTMLElement[] {
    return [...this.root.querySelectorAll<HTMLElement>(group.selector)]
      .filter(isAvailableFocusTarget);
  }

  allows(element: HTMLElement): boolean {
    return this.plan.groups.some((group) => this.elements(group).includes(element));
  }

  refresh(): void {
    for (const element of this.root.querySelectorAll<HTMLElement>("button, a[href], canvas, [tabindex]"))
      element.tabIndex = -1;
    for (const group of this.plan.groups) {
      const items = this.elements(group);
      const active = this.root.ownerDocument.activeElement;
      if (active instanceof HTMLElement && items.includes(active))
        this.selected.set(group.id, active);
      const selected = this.selected.get(group.id);
      const entry = selected && items.includes(selected) ? selected : items[0];
      for (const item of items)
        item.tabIndex = this.plan.tabNavigation !== false && (group.tab === "each" || item === entry) ? 0 : -1;
    }
  }

  tabStops(): HTMLElement[] {
    this.refresh();
    return [...new Set(this.plan.groups.flatMap((group) =>
      this.elements(group).filter((item) => item.tabIndex === 0),
    ))];
  }

  focusInitial(selector = this.plan.initial): void {
    this.refresh();
    const preferred = selector ? this.root.querySelector<HTMLElement>(selector) : null;
    const target = preferred && this.allows(preferred) ? preferred : this.tabStops()[0];
    target?.focus({ preventScroll: true });
  }

  tab(event: KeyboardEvent): boolean {
    if (event.key !== "Tab" || event.ctrlKey || event.metaKey || event.altKey) return false;
    if (this.plan.tabNavigation === false) return true;
    const stops = this.tabStops();
    if (!stops.length) return true;
    const active = this.root.ownerDocument.activeElement;
    const index = stops.findIndex((item) => item === active);
    const next = index < 0 ? (event.shiftKey ? stops.length - 1 : 0)
      : (index + (event.shiftKey ? -1 : 1) + stops.length) % stops.length;
    stops[next]?.focus();
    return true;
  }

  arrow(event: KeyboardEvent): boolean {
    const active = this.root.ownerDocument.activeElement;
    let group = this.plan.groups.find((candidate) =>
      candidate.arrows && this.elements(candidate).some((item) => item === active),
    );
    if (!group && !(active instanceof HTMLElement && this.allows(active)))
      group = this.plan.groups.find((candidate) => candidate.id === this.plan.defaultArrowGroup);
    if (!group) return false;
    const items = this.elements(group);
    const index = items.findIndex((item) => item === active);
    const previous = event.key === "ArrowUp" || event.key === "ArrowLeft";
    const next = event.key === "ArrowDown" || event.key === "ArrowRight";
    if (!previous && !next) return false;
    if (group.arrows === "vertical" && !["ArrowUp", "ArrowDown"].includes(event.key)) return false;
    if (group.arrows === "horizontal" && !["ArrowLeft", "ArrowRight"].includes(event.key)) return false;
    if (index < 0) {
      const remembered = this.selected.get(group.id);
      const target = remembered && items.includes(remembered) ? remembered : items[0];
      target?.focus();
      this.refresh();
      return true;
    }
    const target = group.arrows === "spatial"
      ? spatialNeighbor(items, index, event.key)
      : items[(index + (previous ? -1 : 1) + items.length) % items.length];
    if (target) {
      this.selected.set(group.id, target);
      target.focus();
      this.refresh();
    }
    return true;
  }
}

function spatialNeighbor(items: HTMLElement[], index: number, key: string): HTMLElement | undefined {
  const current = items[index]?.getBoundingClientRect();
  if (!current) return items[0];
  const horizontal = key === "ArrowLeft" || key === "ArrowRight";
  const sign = key === "ArrowLeft" || key === "ArrowUp" ? -1 : 1;
  let best: HTMLElement | undefined;
  let bestScore = Infinity;
  for (const item of items) {
    const rect = item.getBoundingClientRect();
    const dx = rect.x + rect.width / 2 - current.x - current.width / 2;
    const dy = rect.y + rect.height / 2 - current.y - current.height / 2;
    const forward = (horizontal ? dx : dy) * sign;
    if (forward < 1) continue;
    const perpendicular = Math.abs(horizontal ? dy : dx);
    const score = forward + perpendicular * 4;
    if (score < bestScore) {
      best = item;
      bestScore = score;
    }
  }
  return best;
}
