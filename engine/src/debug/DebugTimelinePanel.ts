import type { DebugTraceEntry } from "./DebugTrace.js";

export interface DebugTimelinePanelActions {
  clearTrace(): void;
}

/** Timeline 只负责 trace 的筛选与展示，不读取 World 内部对象。 */
export class DebugTimelinePanel {
  readonly root: HTMLDivElement;
  private readonly count: HTMLSpanElement;
  private readonly list: HTMLDivElement;
  private readonly worldTicks: HTMLInputElement;
  private trace: readonly DebugTraceEntry[] = [];
  private renderKey = "";

  constructor(actions: DebugTimelinePanelActions) {
    this.root = document.createElement("div");
    const section = document.createElement("section");
    Object.assign(section.style, {
      padding: "9px",
      border: "1px solid rgba(255,255,255,.12)",
      borderRadius: "6px",
      background: "rgba(255,255,255,.035)",
    });
    const title = document.createElement("div");
    title.textContent = "Timeline";
    Object.assign(title.style, {
      marginBottom: "7px",
      color: "#9fd6aa",
      fontWeight: "700",
      letterSpacing: ".04em",
    });

    const toolbar = document.createElement("div");
    Object.assign(toolbar.style, {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "8px",
      marginBottom: "7px",
    });
    this.count = document.createElement("span");
    this.count.style.color = "#8da495";
    const controls = document.createElement("div");
    Object.assign(controls.style, {
      display: "flex",
      alignItems: "center",
      gap: "8px",
    });
    const filter = document.createElement("label");
    Object.assign(filter.style, {
      display: "flex",
      alignItems: "center",
      gap: "4px",
      cursor: "pointer",
    });
    this.worldTicks = document.createElement("input");
    this.worldTicks.type = "checkbox";
    this.worldTicks.dataset.debugTimelineWorldTicks = "";
    this.worldTicks.checked = false;
    this.worldTicks.addEventListener("change", () => {
      this.renderKey = "";
      this.renderTrace();
    });
    filter.append(this.worldTicks, document.createTextNode("World ticks"));
    controls.append(filter, button("Clear", () => actions.clearTrace()));
    toolbar.append(this.count, controls);

    this.list = document.createElement("div");
    section.append(title, toolbar, this.list);
    this.root.append(section);
  }

  render(trace: readonly DebugTraceEntry[]): void {
    this.trace = trace;
    this.renderTrace();
  }

  private renderTrace(): void {
    const visible = this.trace.filter(
      (entry) => this.worldTicks.checked || entry.kind !== "world-tick",
    );
    const entries = [...visible].reverse();
    const key = `${this.worldTicks.checked}:${entries
      .map((entry) => entry.seq)
      .join(",")}`;
    this.count.textContent = `${visible.length}/${this.trace.length} events`;
    if (key === this.renderKey) return;
    this.renderKey = key;

    const openEntries = new Set(
      [...this.list.querySelectorAll("details[open]")]
        .map((details) => details.getAttribute("data-seq"))
        .filter((value): value is string => value !== null),
    );
    const fragment = document.createDocumentFragment();
    for (const entry of entries) {
      const details = document.createElement("details");
      details.dataset.seq = String(entry.seq);
      details.open = openEntries.has(String(entry.seq));
      const summary = document.createElement("summary");
      summary.style.cursor = "pointer";
      const world = entry.worldTick === null ? "W-" : `W${entry.worldTick}`;
      const delta =
        entry.worldSequence === undefined ? "" : ` Δ${entry.worldSequence}`;
      const time =
        entry.worldTimeMs === undefined ? "" : ` ${entry.worldTimeMs}ms`;
      summary.textContent = `${world}${delta}${time} ${entry.category.padEnd(12)} ${entry.summary}`;
      const pre = document.createElement("pre");
      Object.assign(pre.style, {
        overflow: "auto",
        whiteSpace: "pre-wrap",
        overflowWrap: "anywhere",
        color: "#bfd0c3",
      });
      pre.textContent = JSON.stringify(entry, null, 2);
      details.append(summary, pre);
      fragment.append(details);
    }
    if (entries.length === 0)
      fragment.append(document.createTextNode("No matching runtime events."));
    this.list.replaceChildren(fragment);
  }
}

function button(label: string, action: () => void): HTMLButtonElement {
  const control = document.createElement("button");
  control.type = "button";
  control.textContent = label;
  Object.assign(control.style, {
    padding: "5px 8px",
    border: "1px solid rgba(255,255,255,.2)",
    borderRadius: "4px",
    background: "#14251a",
    color: "inherit",
    font: "inherit",
    cursor: "pointer",
  });
  control.addEventListener("click", action);
  return control;
}
