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
  if (
    !home || !open || !restart || !sound || !joystick || !joystickLayer ||
    !infoInput || !keyboardSelect
  )
    throw new Error('missing Embed frame controls');
  const initialJoystick = joystick.getAttribute('aria-pressed') === 'true';
  joystick.click();
  await delay(30);
  const toggledJoystick = joystick.getAttribute('aria-pressed') === 'true';
  restart.click();
  await document.fonts.ready;
  const hudStyle = getComputedStyle(hud);
  const valueStyle = getComputedStyle(value);
  return JSON.stringify({
    fontFamily: hudStyle.fontFamily,
    fontReady: document.fonts.check('36px "Jersey 10"'),
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
  });
})()
`;

export function assertEmbedHudSmoke(payload) {
  if (
    !payload.fontFamily.includes("Jersey 10") ||
    !payload.fontReady ||
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
    !payload.gameplayAssetsLoaded ||
    payload.initialJoystick === payload.toggledJoystick ||
    payload.joystickVisible !== payload.toggledJoystick
  )
    throw new Error(`Embed HUD 字体样式异常：${JSON.stringify(payload)}`);
}
