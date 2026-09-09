<template>
  <aside class="replay-panel" data-replay-panel hidden aria-label="Replay 录制">
    <header>
      <div>
        <span>测试输入</span>
        <strong>Replay 录制</strong>
      </div>
      <button type="button" data-replay-action="close" aria-label="关闭 Replay 面板">×</button>
    </header>

    <section class="replay-panel-status">
      <span data-replay-indicator />
      <div>
        <strong data-replay-status>准备录制</strong>
        <small data-replay-ticks>从关卡起点记录 · 0 ticks</small>
      </div>
    </section>

    <p data-replay-message>
      开始录制会从关卡起点重新运行。键盘、摇杆与屏幕操作会记录为 World Tick 上的语义输入。
    </p>

    <div class="replay-panel-primary-actions">
      <button class="primary-btn" type="button" data-replay-action="start">开始录制</button>
      <button class="ghost-btn" type="button" data-replay-action="stop" disabled>停止并复验</button>
    </div>

    <section class="replay-panel-result">
      <div class="replay-panel-result-title">
        <strong>录制结果</strong>
        <span data-replay-verification aria-live="polite">等待录制</span>
      </div>
      <textarea
        data-replay-output
        readonly
        spellcheck="false"
        aria-label="Replay JSON"
        placeholder="停止录制后在这里显示 Replay JSON"
      ></textarea>
      <div class="replay-panel-export-actions">
        <button type="button" data-replay-action="verify" disabled>复验</button>
        <button type="button" data-replay-action="copy" disabled>复制 JSON</button>
        <button type="button" data-replay-action="download" disabled>下载</button>
      </div>
    </section>
  </aside>
</template>

<style scoped>
.replay-panel {
  position: absolute;
  inset: 0 auto 0 0;
  z-index: 8;
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

.replay-panel > header,
.replay-panel-status,
.replay-panel-result-title,
.replay-panel-export-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.replay-panel > header {
  padding-bottom: 12px;
  border-bottom: 1px solid var(--bc-panel-border);
}

.replay-panel > header div {
  display: grid;
}

.replay-panel > header span {
  color: var(--bc-text-muted);
  font-size: 0.7rem;
  letter-spacing: 0.08em;
}

.replay-panel > header button {
  width: 32px;
  height: 32px;
  padding: 0;
}

.replay-panel-status {
  justify-content: flex-start;
  margin-top: 14px;
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

.replay-panel-status div {
  display: grid;
}

.replay-panel-status small,
.replay-panel-result-title span,
.replay-panel > p {
  color: var(--bc-text-muted);
}

.replay-panel-result-title span.failed {
  color: #ff9c8f;
}

.replay-panel > p {
  font-size: 0.78rem;
  line-height: 1.55;
}

.replay-panel-primary-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
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

.replay-panel-export-actions {
  margin-top: 8px;
}

.replay-panel-export-actions button {
  flex: 1 1 0;
  padding-inline: 5px;
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
