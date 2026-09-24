export const embedHudSmokeScript = `
(async () => {
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  let host = null;
  for (let i = 0; i < 120; i += 1) {
    host = document.querySelector('.preview');
    if (
      document.querySelector('[data-preview-state="ready"]') &&
      host?.shadowRoot?.querySelector('.engine-gameplay-hud')
    ) break;
    await delay(50);
  }
  const shadow = host?.shadowRoot;
  const hud = shadow?.querySelector('.engine-gameplay-hud');
  const value = shadow?.querySelector('.engine-gameplay-hud-value');
  if (!hud || !value) throw new Error('missing Embed gameplay HUD');
  const home = shadow.querySelector('.bc5r-home-link');
  const frameActions = [...shadow.querySelectorAll('.bc5r-frame-actions > *')];
  const open = shadow.querySelector('[data-action="open"]');
  const restart = shadow.querySelector('[data-action="restart"]');
  const sound = shadow.querySelector('[data-action="sound"]');
  const joystick = shadow.querySelector('.bc5r-info .bc5r-icon-button');
  const joystickLayer = shadow.querySelector('.engine-screen-joystick-layer');
  const infoInput = document.querySelector('.info-input');
  const keyboardSelect = document.querySelector('.keyboard-select');
  const timerToggle = document.querySelector('.hud-timer');
  const stepsToggle = document.querySelector('.hud-steps');
  const globalMusic = document.querySelector('#music');
  if (
    !home || !open || !restart || !sound || !joystick || !joystickLayer ||
    !infoInput || !keyboardSelect || !timerToggle || !stepsToggle || !globalMusic
  )
    throw new Error('missing Embed frame controls');
  const timer = shadow.querySelector('.engine-gameplay-hud-timer');
  const steps = shadow.querySelector('.engine-gameplay-hud-steps');
  const defaultHud = {
    timer: timer ? getComputedStyle(timer).display !== 'none' : null,
    steps: steps ? getComputedStyle(steps).display !== 'none' : null,
  };
  const initialJoystick = joystick.getAttribute('aria-pressed') === 'true';
  joystick.click();
  await delay(30);
  const toggledJoystick = joystick.getAttribute('aria-pressed') === 'true';
  const initialGlobalMusic = globalMusic.getAttribute('aria-pressed');
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'm' }));
  window.dispatchEvent(new KeyboardEvent('keyup', { key: 'm' }));
  await delay(30);
  const toggledGlobalMusic = globalMusic.getAttribute('aria-pressed');
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'm' }));
  window.dispatchEvent(new KeyboardEvent('keyup', { key: 'm' }));
  await delay(30);
  const restoredGlobalMusic = globalMusic.getAttribute('aria-pressed');
  restart.click();
  await document.fonts.ready;
  const hudStyle = getComputedStyle(hud);
  const valueStyle = getComputedStyle(value);
  const jerseyFaces = [...document.fonts]
    .filter((face) => face.family.replaceAll('"', '') === 'BC5R Jersey 10')
    .map((face) => ({ family: face.family, status: face.status }));
  const initialState = {
    pagePaddingTop: getComputedStyle(document.querySelector('.app-content')).paddingTop,
    pageRootTag: document.querySelector('.embed-page')?.tagName,
    fontFamily: hudStyle.fontFamily,
    fontReady: document.fonts.check('36px "BC5R Jersey 10"'),
    jerseyFaces,
    fontSize: valueStyle.fontSize,
    strokeWidth: hudStyle.webkitTextStrokeWidth,
    homeHref: home.href,
    openPath: new URL(open.href).pathname,
    openHash: new URL(open.href).hash,
    openTarget: open.target,
    actionIds: frameActions.map((element) => element.getAttribute('data-action')),
    actionLabels: frameActions.map((element) => element.getAttribute('aria-label')),
    info: shadow.querySelector('.bc5r-info-copy')?.textContent,
    infoPlaceholder: infoInput.placeholder,
    keyboardOptions: [...keyboardSelect.options].map((option) => option.value),
    gameplayAssetsLoaded: ['b6.png', 'b8.png', 'mow.png', 'hud.png', 'bf.png']
      .every((file) => performance.getEntriesByType('resource').some(
        (entry) => new URL(entry.name).pathname.endsWith('/assets/art/hd/' + file),
      )),
    initialJoystick,
    toggledJoystick,
    joystickVisible: !joystickLayer.hidden,
    initialGlobalMusic,
    toggledGlobalMusic,
    restoredGlobalMusic,
  };
  timerToggle.click();
  stepsToggle.click();
  let enabledTimer = null;
  let enabledSteps = null;
  for (let i = 0; i < 120; i += 1) {
    const nextShadow = host?.shadowRoot;
    const nextTimer = nextShadow?.querySelector('.engine-gameplay-hud-timer');
    const nextSteps = nextShadow?.querySelector('.engine-gameplay-hud-steps');
    if (
      document.querySelector('[data-preview-state="ready"]') &&
      nextTimer &&
      nextSteps &&
      getComputedStyle(nextTimer).display !== 'none' &&
      getComputedStyle(nextSteps).display !== 'none'
    ) {
      enabledTimer = true;
      enabledSteps = true;
      break;
    }
    await delay(50);
  }
  const code = document.querySelector('.code-block');
  const editableCode = code instanceof HTMLTextAreaElement;
  const generatedTimerCode = editableCode && code.value.includes('"timer": true');
  let focusedGlobalMusic = null;
  let focusedEditDeferred = null;
  if (editableCode) {
    code.focus();
    code.dispatchEvent(new KeyboardEvent('keydown', { key: 'm', bubbles: true }));
    code.dispatchEvent(new KeyboardEvent('keyup', { key: 'm', bubbles: true }));
    await delay(30);
    focusedGlobalMusic = globalMusic.getAttribute('aria-pressed');
    code.value = code.value
      .replace('"timer": true', '"timer": false')
      .replace('height:520px', 'height:360px');
    code.dispatchEvent(new Event('input', { bubbles: true }));
    await delay(350);
    const focusedShadow = host?.shadowRoot;
    const focusedTimer = focusedShadow?.querySelector('.engine-gameplay-hud-timer');
    focusedEditDeferred =
      focusedTimer &&
      getComputedStyle(focusedTimer).display !== 'none' &&
      getComputedStyle(host).height === '520px';
    code.blur();
  }
  let editedTimer = null;
  let editedHeight = null;
  for (let i = 0; i < 120; i += 1) {
    const nextShadow = host?.shadowRoot;
    const nextTimer = nextShadow?.querySelector('.engine-gameplay-hud-timer');
    const nextSteps = nextShadow?.querySelector('.engine-gameplay-hud-steps');
    if (
      document.querySelector('[data-preview-state="ready"]') &&
      nextTimer &&
      nextSteps &&
      getComputedStyle(nextTimer).display === 'none' &&
      getComputedStyle(nextSteps).display !== 'none' &&
      getComputedStyle(host).height === '360px'
    ) {
      editedTimer = false;
      editedHeight = getComputedStyle(host).height;
      break;
    }
    await delay(50);
  }
  return JSON.stringify({
    ...initialState,
    defaultHud,
    enabledHud: { timer: enabledTimer, steps: enabledSteps },
    editableCode,
    generatedTimerCode,
    focusedGlobalMusic,
    focusedEditDeferred,
    editedTimer,
    editedHeight,
  });
})()
`;

export function assertEmbedHudSmoke(payload) {
  if (
    payload.pagePaddingTop !== "20px" ||
    payload.pageRootTag !== "DIV" ||
    !payload.fontFamily.includes("BC5R Jersey 10") ||
    !payload.fontReady ||
    !payload.jerseyFaces.some((face) => face.status === "loaded") ||
    payload.fontSize !== "36px" ||
    payload.strokeWidth !== "1px" ||
    payload.homeHref !== "https://bc5r.xujinkai.net/" ||
    payload.openPath !== "/import/v1" ||
    !payload.openHash ||
    payload.openTarget !== "_blank" ||
    JSON.stringify(payload.actionIds) !==
      JSON.stringify(["restart", "open", "sound"]) ||
    !payload.actionLabels.every((label) => typeof label === "string" && label.length > 0) ||
    typeof payload.info !== "string" ||
    payload.info.length === 0 ||
    payload.infoPlaceholder !== payload.info ||
    JSON.stringify(payload.keyboardOptions) !== JSON.stringify(["focus", "global"]) ||
    payload.defaultHud?.timer !== false ||
    payload.defaultHud?.steps !== false ||
    payload.enabledHud?.timer !== true ||
    payload.enabledHud?.steps !== true ||
    !payload.editableCode ||
    !payload.generatedTimerCode ||
    payload.editedTimer !== false ||
    payload.editedHeight !== '360px' ||
    !payload.gameplayAssetsLoaded ||
    payload.initialJoystick === payload.toggledJoystick ||
    payload.joystickVisible !== payload.toggledJoystick ||
    payload.initialGlobalMusic === payload.toggledGlobalMusic ||
    payload.restoredGlobalMusic !== payload.initialGlobalMusic ||
    payload.focusedGlobalMusic !== payload.initialGlobalMusic ||
    payload.focusedEditDeferred !== true
  )
    throw new Error(`Embed HUD 字体样式异常：${JSON.stringify(payload)}`);
}

export async function runEmbedHudSmoke(runBrowserEval, url, parseResult) {
  const result = await runBrowserEval(url, embedHudSmokeScript);
  if (result.status !== 0)
    throw new Error(`Embed HUD 字体检查失败：${result.stderr || result.stdout}`);
  assertEmbedHudSmoke(parseResult(result.stdout));
}
