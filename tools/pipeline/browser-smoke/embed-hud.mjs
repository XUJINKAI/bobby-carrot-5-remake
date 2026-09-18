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
  const open = frameActions.find(
    (element) => element.getAttribute('aria-label') === '在新窗口打开',
  );
  const restart = frameActions.find(
    (element) => element.getAttribute('aria-label') === '重新开始',
  );
  const joystick = shadow.querySelector('.bc5r-info .bc5r-icon-button');
  const joystickLayer = shadow.querySelector('.engine-screen-joystick-layer');
  if (!home || !open || !restart || !joystick || !joystickLayer)
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
    actionLabels: frameActions.map((element) => element.getAttribute('aria-label')),
    info: shadow.querySelector('.bc5r-info-copy')?.textContent,
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
    JSON.stringify(payload.actionLabels) !==
      JSON.stringify(["重新开始", "在新窗口打开", "关闭声音"]) ||
    payload.info !== "WASD / 方向键移动" ||
    payload.initialJoystick === payload.toggledJoystick ||
    payload.joystickVisible !== payload.toggledJoystick
  )
    throw new Error(`Embed HUD 字体样式异常：${JSON.stringify(payload)}`);
}
