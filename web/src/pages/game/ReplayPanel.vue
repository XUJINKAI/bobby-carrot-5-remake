<script setup lang="ts">
import AppIcon from "../../shared/icons/AppIcon.vue";
</script>

<template>
  <aside class="replay-panel" data-replay-panel hidden aria-label="Replay 录制">
    <section class="replay-panel-status">
      <span data-replay-indicator />
      <div>
        <strong data-replay-status>准备录制</strong>
        <small data-replay-ticks>从关卡起点记录 · 0 ticks</small>
      </div>
    </section>

    <button
      class="primary-btn replay-panel-record"
      type="button"
      data-replay-action="record"
    >
      重新开始并录制
    </button>

    <section class="replay-panel-result">
      <div class="replay-panel-result-title">
        <strong>录制结果</strong>
        <span data-replay-verification aria-live="polite">等待录制</span>
      </div>
      <textarea
        data-replay-output
        spellcheck="false"
        aria-label="Replay JSON"
        placeholder="停止录制后在这里显示 Replay JSON"
      ></textarea>
      <label class="replay-panel-skip-thinking">
        <input data-replay-skip-thinking type="checkbox" checked />
        <span>跳过思考时间</span>
      </label>
      <div class="replay-panel-playback-actions">
        <button
          class="primary-btn"
          type="button"
          data-replay-action="play"
          disabled
        >
          播放
        </button>
        <button
          class="ghost-btn"
          type="button"
          data-replay-action="stop-playback"
          disabled
        >
          停止
        </button>
        <div class="replay-panel-speed">
          <button
            class="ghost-btn"
            type="button"
            data-replay-action="slower"
            aria-label="降低游戏速率"
            title="降低游戏速率"
          >
            <AppIcon name="rewind" :size="16" />
          </button>
          <label>
            <input
              data-replay-speed
              type="number"
              inputmode="decimal"
              step="any"
              value="1"
              aria-label="游戏速率"
            />
            <span aria-hidden="true">×</span>
          </label>
          <button
            class="ghost-btn"
            type="button"
            data-replay-action="faster"
            aria-label="提高游戏速率"
            title="提高游戏速率"
          >
            <AppIcon name="fast-forward" :size="16" />
          </button>
        </div>
      </div>
      <div class="replay-panel-seek-actions">
        <button
          class="ghost-btn"
          type="button"
          data-replay-action="beginning"
          disabled
        >
          <AppIcon name="replay-beginning" :size="16" />
          跳到起点
        </button>
        <button
          class="ghost-btn"
          type="button"
          data-replay-action="end"
          disabled
        >
          <AppIcon name="replay-end" :size="16" />
          跳到终点
        </button>
      </div>
      <div class="replay-panel-export-actions">
        <button
          class="ghost-btn"
          type="button"
          data-replay-action="copy"
          disabled
        >
          复制
        </button>
        <button
          class="ghost-btn"
          type="button"
          data-replay-action="download"
          disabled
        >
          下载
        </button>
      </div>
      <button
        class="ghost-btn replay-panel-builtin"
        type="button"
        data-replay-action="load-builtin"
      >
        加载内置过法
      </button>
    </section>
  </aside>
</template>

<style scoped>
.replay-panel {
  position: absolute;
  inset: 0 auto 0 0;
  z-index: 12;
  width: 330px;
  box-sizing: border-box;
  overflow: auto;
  padding: 14px;
  border-right: 1px solid var(--bc-panel-border);
  background: color-mix(in srgb, var(--bc-panel) 97%, transparent);
  color: var(--bc-text);
  box-shadow: 12px 0 30px rgb(0 0 0 / 24%);
}

.replay-panel[hidden] {
  display: none;
}

.replay-panel-status,
.replay-panel-result-title,
.replay-panel-playback-actions,
.replay-panel-export-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.replay-panel-status {
  justify-content: flex-start;
  padding: 12px;
  border: 1px solid var(--bc-panel-border);
  border-radius: 6px;
  background: rgb(255 255 255 / 4%);
}

[data-replay-indicator] {
  width: 12px;
  height: 12px;
  flex: 0 0 auto;
  border-radius: 50%;
  background: #809087;
}

.replay-panel.recording [data-replay-indicator] {
  background: #ff574d;
  box-shadow: 0 0 0 5px rgb(255 87 77 / 15%);
}

.replay-panel.playing [data-replay-indicator] {
  background: #72d8ff;
  box-shadow: 0 0 0 5px rgb(114 216 255 / 15%);
}

.replay-panel-status div {
  display: grid;
}

.replay-panel-status small,
.replay-panel-result-title span {
  color: var(--bc-text-muted);
}

.replay-panel-result-title span.failed {
  color: #ff9c8f;
}

.replay-panel-record {
  width: 100%;
  margin-top: 14px;
}

.replay-panel.recording .replay-panel-record {
  border-color: #ff9c8f;
  background: #a42828;
}

.replay-panel-result {
  margin-top: 18px;
}

.replay-panel-result-title {
  margin-bottom: 7px;
  font-size: 0.78rem;
}

.replay-panel textarea {
  width: 100%;
  height: 210px;
  resize: vertical;
  box-sizing: border-box;
  padding: 9px;
  border: 1px solid var(--bc-panel-border);
  border-radius: 5px;
  background: #07110b;
  color: #c9d8cd;
  font: 11px/1.45 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}

.replay-panel-playback-actions,
.replay-panel-seek-actions,
.replay-panel-export-actions,
.replay-panel-builtin {
  margin-top: 8px;
}

.replay-panel-skip-thinking {
  display: flex;
  align-items: center;
  gap: 7px;
  width: fit-content;
  margin-top: 10px;
  color: var(--bc-text-muted);
  font-size: 0.82rem;
  cursor: pointer;
}

.replay-panel-skip-thinking input {
  width: 16px;
  height: 16px;
  margin: 0;
  accent-color: var(--bc-active);
}

.replay-panel-skip-thinking:has(input:disabled) {
  cursor: default;
  opacity: 0.5;
}

.replay-panel-playback-actions {
  display: grid;
  grid-template-columns: 0.72fr 0.72fr 1.55fr;
}

.replay-panel-speed {
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr) 32px;
  overflow: hidden;
  border: var(--bc-control-border-width) solid var(--bc-panel-border);
  border-radius: var(--bc-control-radius);
  background: var(--bc-control);
}

.replay-panel-speed.invalid {
  border-color: #ff7468;
  box-shadow: 0 0 0 2px rgb(255 116 104 / 24%);
}

.replay-panel-speed button {
  display: grid;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
}

.replay-panel-speed label {
  position: relative;
  display: flex;
  align-items: center;
}

.replay-panel-speed input {
  width: 100%;
  height: 100%;
  min-width: 0;
  box-sizing: border-box;
  padding: 0 18px 0 5px;
  border: 0;
  border-right: 1px solid var(--bc-panel-border);
  border-left: 1px solid var(--bc-panel-border);
  border-radius: 0;
  background: rgb(0 0 0 / 12%);
  color: var(--bc-text);
  text-align: center;
  font: inherit;
  font-variant-numeric: tabular-nums;
  appearance: textfield;
}

.replay-panel-speed input::-webkit-inner-spin-button,
.replay-panel-speed input::-webkit-outer-spin-button {
  margin: 0;
  appearance: none;
}

.replay-panel-speed label > span:last-child {
  position: absolute;
  right: 6px;
  color: var(--bc-text-muted);
  pointer-events: none;
}

.replay-panel-seek-actions,
.replay-panel-export-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
}

.replay-panel-seek-actions button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.replay-panel-playback-actions button,
.replay-panel-seek-actions button,
.replay-panel-export-actions button,
.replay-panel-builtin {
  min-height: 38px;
  padding-inline: 5px;
  font-weight: 700;
}

.replay-panel-builtin {
  width: 100%;
}

.replay-panel-result button:not(:disabled):hover {
  background: var(--bc-control-hover);
}

.replay-panel-result button:not(:disabled):active {
  transform: translateY(1px);
}

.replay-panel-result button:disabled {
  cursor: default;
  opacity: 0.42;
}

.replay-panel-result button:focus-visible,
.replay-panel-skip-thinking input:focus-visible,
.replay-panel-speed input:focus-visible {
  outline: 2px solid var(--bc-text);
  outline-offset: -3px;
}

@media (max-width: 620px) {
  .replay-panel {
    inset: 10px 10px 10px 10px;
    width: auto;
    border: 1px solid var(--bc-panel-border);
    border-radius: 8px;
    box-shadow: 0 16px 48px rgb(0 0 0 / 52%);
  }
}
</style>
