import { waitForBrowserState } from "./browser-regression-wait.mjs";

export async function verifyButtonFocusPolicy(cdp, sessionId) {
  await waitForBrowserState(async () =>
    Boolean(
      await cdp.evaluate(
        sessionId,
        `Boolean(
          document.querySelector('.home-page') &&
          [...document.querySelectorAll('button')]
            .every((button) => button.tabIndex === -1)
        )`,
      ),
    ),
  );

  const initial = await cdp.evaluate(
    sessionId,
    `(() => {
      const button = document.querySelector('#settings');
      button.focus();
      return {
        focusedTag: document.activeElement?.tagName,
        tabIndexes: [...document.querySelectorAll('button')].map((item) => ({
          id: item.id,
          text: item.textContent?.trim(),
          value: item.tabIndex,
        })),
      };
    })()`,
  );
  if (initial.focusedTag === "BUTTON")
    throw new Error("程序化聚焦后按钮仍保留焦点");
  const tabbableButtons = initial.tabIndexes.filter((item) => item.value !== -1);
  if (tabbableButtons.length > 0)
    throw new Error(
      `初始按钮仍在 Tab 焦点顺序中：${JSON.stringify(tabbableButtons)}`,
    );

  const center = await cdp.evaluate(
    sessionId,
    `(() => {
      const rect = document.querySelector('#settings').getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    })()`,
  );
  await cdp.send(
    "Input.dispatchMouseEvent",
    {
      type: "mousePressed",
      x: center.x,
      y: center.y,
      button: "left",
      clickCount: 1,
    },
    sessionId,
  );
  await cdp.send(
    "Input.dispatchMouseEvent",
    {
      type: "mouseReleased",
      x: center.x,
      y: center.y,
      button: "left",
      clickCount: 1,
    },
    sessionId,
  );
  await waitForBrowserState(async () =>
    Boolean(
      await cdp.evaluate(
        sessionId,
        "document.querySelector('[data-quick-settings-layer]')",
      ),
    ),
  );
  const pointerFocusedTag = await cdp.evaluate(
    sessionId,
    "document.activeElement?.tagName",
  );
  if (pointerFocusedTag === "BUTTON")
    throw new Error("指针点击后按钮仍保留焦点");

  const formFocusedTag = await cdp.evaluate(
    sessionId,
    `(() => {
      const input = document.querySelector('.quick-settings-panel input');
      input.focus();
      return document.activeElement?.tagName;
    })()`,
  );
  if (formFocusedTag !== "INPUT")
    throw new Error("按钮焦点策略影响了表单输入焦点");

  await cdp.evaluate(
    sessionId,
    `(() => {
      const layer = document.querySelector('[data-quick-settings-layer]');
      const dynamicButton = document.createElement('button');
      dynamicButton.textContent = 'dynamic';
      layer.append(dynamicButton);
      document.body.focus();
    })()`,
  );
  const key = { key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 };
  await cdp.send(
    "Input.dispatchKeyEvent",
    { type: "keyDown", ...key },
    sessionId,
  );
  await cdp.send(
    "Input.dispatchKeyEvent",
    { type: "keyUp", ...key },
    sessionId,
  );
  const afterTab = await cdp.evaluate(
    sessionId,
    `(() => ({
      dynamicTabIndex: [...document.querySelectorAll('button')]
        .find((item) => item.textContent === 'dynamic')?.tabIndex,
      focusedTag: document.activeElement?.tagName,
    }))()`,
  );
  if (afterTab.dynamicTabIndex !== -1 || afterTab.focusedTag === "BUTTON")
    throw new Error("动态按钮进入了 Tab 焦点顺序");
}
