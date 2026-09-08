<script setup lang="ts">
import type { Locale } from "@bobby/i18n";
import { webT } from "../../i18n/webI18n.js";
import type { WebTheme } from "../../theme/webTheme.js";
import type { MusicMode } from "../settings/globalPreferences.js";
import type { GlobalSettingsState } from "../settings/useGlobalSettings.js";
import AppIcon from "../../shared/icons/AppIcon.vue";

defineProps<{ state: GlobalSettingsState }>();
const emit = defineEmits<{
  close: [];
  locale: [value: Locale];
  theme: [value: WebTheme];
  musicMode: [value: MusicMode];
  volume: [value: number];
  moreSettings: [];
}>();

function numberValue(event: Event): number {
  return Number((event.target as HTMLInputElement).value);
}
</script>

<template>
  <aside class="quick-settings-panel" role="dialog" :aria-label="webT('settings.quickTitle')">
    <div class="quick-settings-row">
      <span class="quick-settings-label">{{ webT('settings.language') }}</span>
      <div class="quick-button-group" role="radiogroup" :aria-label="webT('settings.language')">
        <button
          type="button"
          role="radio"
          :aria-checked="state.locale === 'zh-CN'"
          :class="{ selected: state.locale === 'zh-CN' }"
          @click="emit('locale', 'zh-CN')"
        >中文</button>
        <button
          type="button"
          role="radio"
          :aria-checked="state.locale === 'en'"
          :class="{ selected: state.locale === 'en' }"
          @click="emit('locale', 'en')"
        >English</button>
      </div>
    </div>

    <div class="quick-settings-row">
      <span class="quick-settings-label">{{ webT('settings.theme') }}</span>
      <div class="quick-button-group" role="radiogroup" :aria-label="webT('settings.theme')">
        <button
          type="button"
          role="radio"
          :aria-checked="state.theme === 'bobby'"
          :class="{ selected: state.theme === 'bobby' }"
          @click="emit('theme', 'bobby')"
        >{{ webT('settings.themeBobby') }}</button>
        <button
          type="button"
          role="radio"
          :aria-checked="state.theme === 'fc'"
          :class="{ selected: state.theme === 'fc' }"
          @click="emit('theme', 'fc')"
        >{{ webT('settings.themeFc') }}</button>
      </div>
    </div>

    <div class="quick-settings-row quick-settings-row-music">
      <span class="quick-settings-label">{{ webT('settings.music') }}</span>
      <div class="quick-button-group" role="radiogroup" :aria-label="webT('settings.music')">
        <button
          type="button"
          role="radio"
          :aria-checked="state.musicMode === 'follow-theme'"
          :class="{ selected: state.musicMode === 'follow-theme' }"
          @click="emit('musicMode', 'follow-theme')"
        >{{ webT('settings.musicFollowTheme') }}</button>
        <button
          type="button"
          role="radio"
          :aria-checked="state.musicMode === 'modern'"
          :class="{ selected: state.musicMode === 'modern' }"
          @click="emit('musicMode', 'modern')"
        >{{ webT('settings.musicModern') }}</button>
        <button
          type="button"
          role="radio"
          :aria-checked="state.musicMode === '8bit'"
          :class="{ selected: state.musicMode === '8bit' }"
          @click="emit('musicMode', '8bit')"
        >8bit</button>
      </div>
    </div>

    <label class="quick-settings-row quick-volume-row">
      <span class="quick-settings-label">{{ webT('settings.volume') }}</span>
      <input
        type="range"
        min="0"
        max="200"
        step="1"
        :value="state.volume"
        :aria-valuetext="`${state.volume}%`"
        @input="emit('volume', numberValue($event))"
      >
      <output>{{ state.volume }}%</output>
    </label>

    <button type="button" class="quick-settings-more" @click="emit('moreSettings')">
      <span>{{ webT('settings.more') }}</span>
      <AppIcon name="next" />
    </button>
  </aside>
</template>

<style scoped>
.quick-settings-panel {
  width: min(430px, calc(100vw - 24px));
  display: grid;
  gap: 4px;
  padding: 12px;
  border: var(--bc-panel-border-width) solid var(--bc-panel-border);
  border-radius: var(--bc-panel-radius);
  background: var(--bc-panel);
  color: var(--bc-text);
  box-shadow: var(--bc-panel-shadow);
}

.quick-settings-row {
  min-height: 48px;
  display: grid;
  grid-template-columns: 74px minmax(0, 1fr);
  align-items: center;
  gap: 12px;
  padding: 5px 4px;
}

.quick-settings-label {
  color: var(--bc-text-muted);
  font-size: 0.85rem;
  font-weight: 700;
}

.quick-button-group {
  min-width: 0;
  display: flex;
  overflow: hidden;
  border: 1px solid var(--bc-panel-border);
  border-radius: var(--bc-control-radius);
  background: var(--bc-control);
}

.quick-button-group button {
  min-width: 0;
  min-height: 34px;
  flex: 1 1 auto;
  padding: 5px 10px;
  border: 0;
  border-right: 1px solid var(--bc-panel-border);
  background: transparent;
  color: var(--bc-text);
  white-space: nowrap;
}

.quick-button-group button:last-child {
  border-right: 0;
}

.quick-button-group button:hover {
  background: var(--bc-control-hover);
}

.quick-button-group button.selected {
  background: var(--bc-control-selected);
  color: var(--bc-control-selected-text);
}

.quick-volume-row {
  grid-template-columns: 74px minmax(0, 1fr) 44px;
}

.quick-volume-row input {
  width: 100%;
  accent-color: var(--bc-active);
}

.quick-volume-row output {
  color: var(--bc-text-muted);
  font-size: 0.76rem;
  text-align: right;
}

.quick-settings-more {
  min-height: 42px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 4px;
  padding: 8px 10px;
  border: 0;
  border-top: 1px solid var(--bc-panel-border);
  background: transparent;
  color: var(--bc-text);
  font-weight: 700;
  text-align: left;
}

.quick-settings-more:hover {
  color: var(--bc-highlight);
}

@media (max-width: 480px) {
  .quick-settings-panel {
    width: calc(100vw - 16px);
    padding: 10px;
  }

  .quick-settings-row,
  .quick-volume-row {
    grid-template-columns: 1fr;
    gap: 6px;
  }

  .quick-volume-row output {
    display: none;
  }
}
</style>
