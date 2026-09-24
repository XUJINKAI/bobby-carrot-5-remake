<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from "vue";
import type {
  ImportedData,
  ImportedSaveData,
} from "../../services/import/importPipeline.js";
import DataExchangePanel from "../../shared/data-exchange/DataExchangePanel.vue";
import AppIcon from "../../shared/icons/AppIcon.vue";
import { createBackdropDismissHandlers } from "../../shared/dialog/backdropDismiss.js";
import ImportSaveConfirmation from "../import/ImportSaveConfirmation.vue";
import { openWebI18nScope, type WebI18nScope, webT } from "../../i18n/webI18n.js";

const emit = defineEmits<{
  navigate: [path: string];
  importData: [data: ImportedData];
}>();
const importOpen = ref(false);
const pendingSave = ref<ImportedSaveData | null>(null);
let importScope: WebI18nScope | null = null;
const toolbar = computed(() => ({
  left: [
    { type: "importText" as const },
    { type: "importFile" as const, accept: "*/*" },
  ],
  right: [],
}));

async function parseImport(value: unknown): Promise<ImportedData> {
  const { requireImportedJson } = await import(
    "../../services/import/importPipeline.js"
  );
  return requireImportedJson(value);
}

function serializeImport(value: unknown): string {
  return JSON.stringify((value as ImportedData).value, null, 2);
}

async function acceptImport(data: unknown): Promise<void> {
  const imported = data as ImportedData;
  if (imported.type === "map") {
    closeImport();
    emit("importData", imported);
    return;
  }
  const scope = openWebI18nScope(["import"]);
  importScope?.dispose();
  importScope = scope;
  try {
    await scope.ready;
  } catch {
    if (importScope === scope) importScope = null;
    return;
  }
  if (!scope.active || importScope !== scope) return;
  pendingSave.value = imported;
}

function confirmSave(): void {
  const data = pendingSave.value;
  if (!data) return;
  closeImport();
  emit("importData", data);
}

function cancelPendingSave(): void {
  pendingSave.value = null;
  importScope?.dispose();
  importScope = null;
}

function closeImport(): void {
  cancelPendingSave();
  importOpen.value = false;
}

const backdropDismiss = createBackdropDismissHandlers(closeImport);

onBeforeUnmount(() => {
  importScope?.dispose();
});
</script>

<template>
  <nav class="home-mode-panel" :aria-label="webT('home.modeAria')">
    <header>
      <span class="eyebrow">PLAY YOUR WAY</span>
      <span>{{ webT("home.modeTitle") }}</span>
    </header>
    <div class="home-mode-grid">
      <a
        class="home-mode-card"
        href="/explore"
        @click.prevent="emit('navigate', '/explore')"
      >
        <strong>{{ webT("nav.explore") }}</strong>
        <span>{{ webT("home.exploreDescription") }}</span>
        <AppIcon name="next" />
      </a>
      <a
        class="home-mode-card"
        href="/adventure"
        @click.prevent="emit('navigate', '/adventure')"
      >
        <strong>{{ webT("nav.adventure") }}</strong>
        <span>{{ webT("home.adventureDescription") }}</span>
        <AppIcon name="next" />
      </a>
      <a
        class="home-mode-card"
        href="/edit"
        @click.prevent="emit('navigate', '/edit')"
      >
        <strong>{{ webT("nav.editor") }}</strong>
        <span>{{ webT("home.editorDescription") }}</span>
        <AppIcon name="next" />
      </a>
      <button
        class="home-mode-card"
        data-home-import
        type="button"
        @click="importOpen ? closeImport() : importOpen = true"
      >
        <strong>{{ webT("home.import") }}</strong>
        <span>{{ webT("home.importDescription") }}</span>
        <AppIcon name="place" />
      </button>
    </div>
    <a
      class="home-embed-link"
      href="/embed"
      @click.prevent="emit('navigate', '/embed')"
    >
      <span>{{ webT("home.embed") }}</span>
      <AppIcon name="next" />
    </a>
    <Teleport to="body">
      <div
        v-if="importOpen"
        class="home-import-dialog-layer"
        role="presentation"
        @pointerdown="backdropDismiss.pointerDown"
        @pointerup="backdropDismiss.pointerUp"
        @pointercancel="backdropDismiss.pointerCancel"
        @click="backdropDismiss.click"
      >
        <section class="home-import-dialog" role="dialog" aria-modal="true" :aria-label="webT('home.importDialog')">
          <header>
            <strong>{{ webT("home.importDialog") }}</strong>
            <button type="button" :aria-label="webT('common.close')" @click="closeImport">
              <AppIcon name="close" />
            </button>
          </header>
          <ImportSaveConfirmation
            v-if="pendingSave"
            :data="pendingSave"
            @confirm="confirmSave"
            @cancel="cancelPendingSave"
          />
          <DataExchangePanel
            v-else
            class="home-data-exchange"
            :serialize="serializeImport"
            :parse="parseImport"
            :placeholder="webT('home.importPlaceholder')"
            filename="bc5r-data"
            :toolbar="toolbar"
            @import="acceptImport"
          />
        </section>
      </div>
    </Teleport>
    <slot />
  </nav>
</template>

<style scoped>
.home-mode-panel {
  width: min(100%, 378px);
  margin-inline: auto;
  display: grid;
  gap: 10px;
}

.home-mode-panel > header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding: 0 2px 6px;
  color: var(--bc-text-muted);
  font-size: 0.78rem;
}

.home-mode-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 9px;
}

.home-mode-card {
  position: relative;
  min-height: 72px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 4px 12px;
  align-content: center;
  width: 100%;
  padding: 12px 16px;
  border: var(--bc-control-border-width) solid var(--bc-panel-border);
  border-radius: var(--bc-control-radius);
  background: color-mix(in srgb, var(--bc-panel) 92%, transparent);
  color: var(--bc-text);
  text-align: left;
  text-decoration: none;
  box-shadow: var(--bc-panel-shadow);
  transition: transform 120ms ease, border-color 120ms ease, background 120ms ease;
}

.home-mode-card:hover {
  transform: translateY(-1px);
  border-color: var(--bc-text-muted);
  background: var(--bc-control-hover);
}

.home-mode-card strong {
  font-size: 0.92rem;
}

.home-mode-card span {
  color: var(--bc-text-muted);
  font-size: 0.71rem;
  line-height: 1.35;
}

.home-mode-card :deep(.app-icon) {
  grid-column: 2;
  grid-row: 1 / span 2;
  align-self: center;
  color: var(--bc-highlight);
  font-size: 1.15rem;
}

.home-embed-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  justify-self: start;
  margin: 2px 2px 0;
  color: var(--bc-text-muted);
  font-size: 0.86rem;
  text-decoration-thickness: 1px;
  text-underline-offset: 3px;
}

.home-embed-link:hover {
  color: var(--bc-text);
}

.home-import-dialog-layer {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgb(0 0 0 / 78%);
}

.home-import-dialog {
  width: min(660px, 100%);
  padding: 18px;
  border: var(--bc-panel-border-width) solid var(--bc-panel-border);
  border-radius: var(--bc-panel-radius);
  background: var(--bc-panel);
  box-shadow: var(--bc-panel-shadow);
}

.home-import-dialog > header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.home-import-dialog > header button {
  border: 0;
  background: transparent;
  color: inherit;
  font-size: 1.4rem;
}
</style>
