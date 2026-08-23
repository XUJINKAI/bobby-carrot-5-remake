import fs from 'node:fs';

function edit(path, transform) {
  const before = fs.readFileSync(path, 'utf8');
  const after = transform(before);
  if (after === before) throw new Error(`No change produced for ${path}`);
  fs.writeFileSync(path, after);
}
function once(text, from, to, label) {
  const i = text.indexOf(from);
  if (i < 0) throw new Error(`Missing ${label}`);
  if (text.indexOf(from, i + from.length) >= 0) throw new Error(`Duplicate ${label}`);
  return text.slice(0, i) + to + text.slice(i + from.length);
}

edit('web/src/main.ts', (text) => {
  text = once(text,
    '      <aside id="debug-panel" class="debug-panel" aria-live="polite"></aside>\n      <div id="status" class="game-status" hidden></div>',
    '      <aside id="debug-panel" class="debug-panel" aria-live="polite"><div class="debug-engine"></div><pre class="debug-inspector"></pre></aside>',
    'debug panel markup');
  text = once(text,
    "  const status = document.querySelector<HTMLDivElement>('#status');\n  const debugPanel = document.querySelector<HTMLElement>('#debug-panel');",
    "  const debugPanel = document.querySelector<HTMLElement>('#debug-panel');\n  const debugEngine = debugPanel?.querySelector<HTMLElement>('.debug-engine');\n  const debugInspector = debugPanel?.querySelector<HTMLElement>('.debug-inspector');",
    'debug panel queries');
  text = once(text,
    "  if (!canvas || !status || !debugPanel || !gameResult || !resultCard || !hudTime || !hudObjectives || !hudObjectiveIcon || !hudMoves || !hudItems) throw new Error('Game UI failed to mount');",
    "  if (!canvas || !debugPanel || !debugEngine || !debugInspector || !gameResult || !resultCard || !hudTime || !hudObjectives || !hudObjectiveIcon || !hudMoves || !hudItems) throw new Error('Game UI failed to mount');",
    'mount guard');
  text = once(text,
    "    debugPanel.textContent = activeGame.debug ? `${debugInspection ?? 'DEBUG\\n点击地图格查看详情'}\\n\\nENGINE MESSAGE\\n${engineMessage}` : '';\n    status.classList.toggle('debug', activeGame.debug);\n    status.hidden = !activeGame.debug;\n    status.textContent = activeGame.debug ? engineMessage : '';",
    "    debugEngine.textContent = activeGame.debug ? `ENGINE MESSAGE\\n${engineMessage}` : '';\n    debugInspector.textContent = activeGame.debug ? (debugInspection ?? 'DEBUG\\n点击地图格查看详情') : '';",
    'debug rendering');
  return text;
});

edit('web/style.css', (text) => {
  text += `\n\n/* Final DEBUG layout: engine message on top, inspector fills remaining right-side height. */\n.debug-panel{top:12px;right:12px;bottom:12px;width:min(320px,calc(100% - 24px));max-height:none;overflow:hidden;padding:0;white-space:normal;flex-direction:column}\n.debug-panel.visible{display:flex}\n.debug-engine{flex:0 0 auto;padding:10px 12px;border-bottom:1px solid #ffffff20;background:#0d1811e8;white-space:pre-wrap;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;color:#e5f5d7}\n.debug-inspector{flex:1 1 auto;min-height:0;overflow:auto;margin:0;padding:10px 12px;white-space:pre-wrap;font:inherit;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;color:inherit}\n`;
  return text;
});

console.log('Finalized DEBUG panel layout.');
