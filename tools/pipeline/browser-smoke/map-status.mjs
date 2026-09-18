export const mapStatusSmokeScript = `
(async () => {
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  let button = null;
  for (let i = 0; i < 120 && !button; i += 1) {
    await delay(50);
    button = document.querySelector('#map-status');
  }
  if (!button) throw new Error('missing map status icon');
  const indicator = button.closest('.shell-indicator');
  if (!indicator) throw new Error('missing map status wrapper');
  indicator.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse' }));
  await delay(30);
  const tooltip = document.querySelector('[role="tooltip"]');
  const details = Object.fromEntries(
    [...document.querySelectorAll('[data-indicator-detail]')].map((row) => [
      row.getAttribute('data-indicator-detail'),
      row.querySelector('.shell-indicator-detail-value')?.textContent,
    ]),
  );
  const note = document.querySelector(
    '[data-indicator-detail="note"] .shell-indicator-detail-value',
  );
  const noteWhiteSpace = note ? getComputedStyle(note).whiteSpace : null;
  const tooltipOverflowY = tooltip ? getComputedStyle(tooltip).overflowY : null;
  indicator.dispatchEvent(new PointerEvent('pointerleave', { pointerType: 'mouse' }));
  button.dispatchEvent(new PointerEvent('pointerdown', {
    pointerType: 'touch',
    bubbles: true,
  }));
  button.click();
  await delay(30);
  const touchVisible = Boolean(document.querySelector('[role="tooltip"]'));
  document.body.dispatchEvent(new PointerEvent('pointerdown', {
    pointerType: 'touch',
    bubbles: true,
  }));
  await delay(30);
  const dismissed = !document.querySelector('[role="tooltip"]');
  return JSON.stringify({
    icon: button.querySelector('[data-icon]')?.getAttribute('data-icon'),
    tone: button.classList.contains('tone-success') ? 'success' : 'muted',
    details,
    noteWhiteSpace,
    tooltipOverflowY,
    touchVisible,
    dismissed,
  });
})()
`;

export function assertMapStatusSmoke(payload, expected) {
  if (
    payload.icon !== expected.icon ||
    payload.tone !== expected.tone ||
    JSON.stringify(payload.details) !== JSON.stringify(expected.details) ||
    (expected.details.note && payload.noteWhiteSpace !== "pre-wrap") ||
    payload.tooltipOverflowY !== "auto" ||
    !payload.touchVisible ||
    !payload.dismissed
  ) {
    throw new Error(`地图状态 tooltip 异常：${JSON.stringify(payload)}`);
  }
}
