import { onBeforeUnmount, onMounted, ref } from "vue";

export interface EditorMaterialTooltipRow {
  label: string;
  value: string;
}

export interface EditorMaterialTooltipModel {
  key: string;
  title: string;
  code?: string;
  rows?: readonly EditorMaterialTooltipRow[];
  hint?: string;
  anchor: DOMRect;
}

let tooltipSequence = 0;

export function useEditorMaterialTooltip() {
  const tooltip = ref<EditorMaterialTooltipModel | null>(null);
  const tooltipId = `editor-material-tooltip-${tooltipSequence += 1}`;
  let showTimer: ReturnType<typeof setTimeout> | null = null;

  function schedule(
    key: string,
    event: MouseEvent | FocusEvent,
    content: Omit<EditorMaterialTooltipModel, "key" | "anchor">,
    delayMs = 10,
  ): void {
    cancelTimer();
    const target = event.currentTarget;
    if (!(target instanceof HTMLElement)) return;
    const anchor = target.getBoundingClientRect();
    showTimer = setTimeout(() => {
      tooltip.value = { ...content, key, anchor };
      showTimer = null;
    }, delayMs);
  }

  function showOnFocus(
    key: string,
    event: FocusEvent,
    content: Omit<EditorMaterialTooltipModel, "key" | "anchor">,
  ): void {
    schedule(key, event, content, 0);
  }

  function hide(): void {
    cancelTimer();
    tooltip.value = null;
  }

  function cancelTimer(): void {
    if (showTimer === null) return;
    clearTimeout(showTimer);
    showTimer = null;
  }

  onMounted(() => {
    window.addEventListener("scroll", hide, true);
    window.addEventListener("resize", hide);
  });
  onBeforeUnmount(() => {
    hide();
    window.removeEventListener("scroll", hide, true);
    window.removeEventListener("resize", hide);
  });

  return { tooltip, tooltipId, schedule, showOnFocus, hide };
}
