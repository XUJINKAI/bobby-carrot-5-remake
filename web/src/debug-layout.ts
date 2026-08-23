const DEBUG_MARKER = '\n\nENGINE MESSAGE\n';

const style = document.createElement('style');
style.textContent = `
.game-stage:has(> .debug-panel) > .game-status.debug {
  left:auto;
  right:12px;
  top:12px;
  bottom:auto;
  width:min(320px,calc(100% - 24px));
  max-width:none;
  z-index:3;
}
.game-stage > .debug-panel {
  top:66px;
  right:12px;
  bottom:12px;
  width:min(320px,calc(100% - 24px));
  max-height:none;
  overflow:auto;
}
@media(max-width:700px){
  .game-stage:has(> .debug-panel) > .game-status.debug,
  .game-stage > .debug-panel { width:min(300px,calc(100% - 24px)); }
}
`;
document.head.append(style);

function attachDebugPanel(panel: HTMLElement): void {
  if (panel.dataset.layoutAdapter === 'engine-message-above') return;
  panel.dataset.layoutAdapter = 'engine-message-above';

  const normalize = (): void => {
    const value = panel.textContent ?? '';
    const markerIndex = value.lastIndexOf(DEBUG_MARKER);
    if (markerIndex >= 0) panel.textContent = value.slice(0, markerIndex);
  };

  new MutationObserver(normalize).observe(panel, { childList: true, characterData: true, subtree: true });
  normalize();
}

function scan(): void {
  document.querySelectorAll<HTMLElement>('.game-stage > #debug-panel').forEach(attachDebugPanel);
}

new MutationObserver(scan).observe(document.body, { childList: true, subtree: true });
scan();
