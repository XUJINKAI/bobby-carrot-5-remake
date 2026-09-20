export async function runEditorSourceSmoke(
  runBrowserEval,
  lastJsonLine,
  url,
  expectedWin,
) {
  const script = `
(async () => {
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  for (let i = 0; i < 120 && !document.querySelector('#editor-share'); i += 1)
    await delay(50);
  const shareButton = document.querySelector('#editor-share');
  if (!shareButton) throw new Error('missing editor share button');
  shareButton.click();
  let value = '';
  for (let i = 0; i < 120 && !value; i += 1) {
    await delay(50);
    value = document.querySelector('.editor-dialog .data-exchange-text')?.value ?? '';
  }
  const compressed = /\\/import\\/v1#[A-Za-z0-9_-]+$/.test(value);
  const checkbox = document.querySelector('.data-exchange-check input[type="checkbox"]');
  if (checkbox?.checked) checkbox.click();
  for (let i = 0; i < 120 && !value.trimStart().startsWith('{'); i += 1) {
    await delay(50);
    value = document.querySelector('.editor-dialog .data-exchange-text')?.value ?? '';
  }
  return JSON.stringify({
    hash: location.hash,
    compressed,
    win: JSON.parse(value).rules?.win,
  });
})()
`;
  const result = await runBrowserEval(url, script);
  if (result.status !== 0) {
    throw new Error(
      `Interactive editor source smoke failed: ${result.stderr || result.stdout}`,
    );
  }
  const payload = lastJsonLine(result.stdout);
  if (
    payload.hash ||
    !payload.compressed ||
    JSON.stringify(payload.win) !== JSON.stringify(expectedWin)
  )
    throw new Error(`Unexpected editor source result: ${JSON.stringify(payload)}`);
}

export async function runEditorPlaySmoke(runBrowserEval, lastJsonLine, url) {
  const script = `
(async () => {
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  for (let i = 0; i < 120 && !document.querySelector('#editor-play'); i += 1)
    await delay(50);
  const playButton = document.querySelector('#editor-play');
  if (!playButton) throw new Error('missing editor play button');
  playButton.click();
  for (let i = 0; i < 120 && !document.querySelector('#map-status'); i += 1)
    await delay(50);
  const canvas = document.querySelector('#editor-game');
  const status = document.querySelector('#map-status');
  const playPath = location.pathname;
  history.back();
  for (let i = 0; i < 120 && location.pathname !== '/edit'; i += 1)
    await delay(50);
  const editPath = location.pathname;
  history.forward();
  for (let i = 0; i < 120 && (
    location.pathname !== '/edit/test' || !document.querySelector('#map-status')
  ); i += 1)
    await delay(50);
  return JSON.stringify({
    stage: Boolean(canvas?.closest('[data-game-stage]')),
    replay: Boolean(document.querySelector('[data-replay-panel]')),
    hud: Boolean(document.querySelector('.engine-gameplay-hud')),
    status: status?.getAttribute('aria-label') ?? '',
    playPath,
    editPath,
    forwardPath: location.pathname,
  });
})()
`;
  const result = await runBrowserEval(url, script);
  if (result.status !== 0) {
    throw new Error(
      `Interactive editor Play Test smoke failed: ${result.stderr || result.stdout}`,
    );
  }
  const payload = lastJsonLine(result.stdout);
  if (
    !payload.stage ||
    !payload.replay ||
    !payload.hud ||
    !payload.status.includes("editor/draft") ||
    !/(编辑器草稿|Editor draft)/.test(payload.status) ||
    payload.playPath !== "/edit/test" ||
    payload.editPath !== "/edit" ||
    payload.forwardPath !== "/edit/test"
  ) {
    throw new Error(
      `Unexpected editor Play Test result: ${JSON.stringify(payload)}`,
    );
  }
}
