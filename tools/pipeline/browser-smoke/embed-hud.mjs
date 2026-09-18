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
  await document.fonts.ready;
  const hudStyle = getComputedStyle(hud);
  const valueStyle = getComputedStyle(value);
  return JSON.stringify({
    fontFamily: hudStyle.fontFamily,
    fontReady: document.fonts.check('36px "Jersey 10"'),
    fontSize: valueStyle.fontSize,
    strokeWidth: hudStyle.webkitTextStrokeWidth,
  });
})()
`;

export function assertEmbedHudSmoke(payload) {
  if (
    !payload.fontFamily.includes("Jersey 10") ||
    !payload.fontReady ||
    payload.fontSize !== "36px" ||
    payload.strokeWidth !== "1px"
  )
    throw new Error(`Embed HUD 字体样式异常：${JSON.stringify(payload)}`);
}
