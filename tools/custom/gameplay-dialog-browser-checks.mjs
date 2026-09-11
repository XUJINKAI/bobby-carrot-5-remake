import { waitForBrowserState } from "./browser-regression-wait.mjs";

/** 在真实浏览器里验证 Engine 对话框的选项导航与输入租约。 */
export async function verifyGameplayDialogKeyboard(
  cdp,
  sessionId,
  moduleUrl,
) {
  await cdp.evaluate(
    sessionId,
    `(() => {
      window.__gameplayDialogCheck = { ready: false };
      import(${JSON.stringify(moduleUrl)}).then(({ GameplayDialog }) => {
        const canvas = document.querySelector('#game');
        const mount = canvas?.parentElement;
        if (!canvas || !mount) throw new Error('Gameplay canvas is missing');
        const game = {
          lastMove: null,
          lastWorldEvents: [],
          onWorldEvent: () => () => {},
          on: () => () => {},
        };
        const input = {
          enabled: true,
          changes: [],
          get isEnabled() { return this.enabled; },
          setEnabled(value) {
            this.enabled = value;
            this.changes.push(value);
          },
        };
        const dialog = new GameplayDialog(
          game,
          canvas,
          { root: mount, characterIntervalMs: 200 },
          input,
        );
        dialog.root.dataset.browserDialogCheck = 'true';
        const state = window.__gameplayDialogCheck;
        Object.assign(state, { ready: true, dialog, input, result: null });
        void dialog.present({
          message: '请选择',
          options: [
            { id: 'first', label: '一' },
            { id: 'second', label: '二', primary: true },
            { id: 'third', label: '三' },
            { id: 'fourth', label: '四' },
          ],
        }).then((result) => { state.result = result; });
      });
      return true;
    })()`,
  );
  await waitForBrowserState(async () =>
    Boolean(await cdp.evaluate(sessionId, "window.__gameplayDialogCheck?.ready")),
  );
  const typing = await cdp.evaluate(
    sessionId,
    `(() => {
      const text = document.querySelector(
        '[data-browser-dialog-check] .engine-gameplay-dialog-text'
      );
      return text?.dataset.typing === 'true' && text.textContent !== '请选择';
    })()`,
  );
  if (!typing) throw new Error("Gameplay Dialog did not type text progressively");
  await dispatchKey(cdp, sessionId, "Enter", 13);
  await expectSelected(cdp, sessionId, "second");
  const optionStyles = await cdp.evaluate(
    sessionId,
    `(() => {
      const first = document.querySelector(
        '[data-browser-dialog-check] [data-dialog-option="first"]'
      );
      const second = document.querySelector(
        '[data-browser-dialog-check] [data-dialog-option="second"]'
      );
      return {
        first: {
          background: first?.style.background,
          border: first?.style.borderColor,
          shadow: first?.style.boxShadow,
        },
        second: {
          background: second?.style.background,
          border: second?.style.borderColor,
          shadow: second?.style.boxShadow,
        },
      };
    })()`,
  );
  if (
    optionStyles.first.background === optionStyles.second.background ||
    optionStyles.first.border === optionStyles.second.border ||
    optionStyles.second.shadow === "none"
  ) {
    throw new Error("Gameplay Dialog selected option is not visually distinct");
  }
  const suspended = await cdp.evaluate(
    sessionId,
    "window.__gameplayDialogCheck.input.enabled === false",
  );
  if (!suspended) throw new Error("Gameplay Dialog did not suspend input");

  await dispatchKey(cdp, sessionId, "ArrowRight", 39);
  await expectSelected(cdp, sessionId, "third");
  await dispatchKey(cdp, sessionId, "ArrowLeft", 37);
  await dispatchKey(cdp, sessionId, "ArrowLeft", 37);
  await expectSelected(cdp, sessionId, "first");
  await dispatchKey(cdp, sessionId, "Enter", 13);

  await waitForBrowserState(async () =>
    Boolean(
      await cdp.evaluate(
        sessionId,
        `(() => {
          const state = window.__gameplayDialogCheck;
          return state?.result?.type === 'selected' &&
            state.result.optionId === 'first' &&
            state.input.enabled === true &&
            state.dialog.root.hidden;
        })()`,
      ),
    ),
  );
  await cdp.evaluate(
    sessionId,
    "window.__gameplayDialogCheck.dialog.destroy(); true",
  );
}

async function expectSelected(cdp, sessionId, optionId) {
  await waitForBrowserState(async () =>
    Boolean(
      await cdp.evaluate(
        sessionId,
        `document.querySelector(
          '[data-browser-dialog-check] [data-dialog-option=${JSON.stringify(optionId)}]'
        )?.dataset.selected === 'true'`,
      ),
    ),
  );
}

async function dispatchKey(cdp, sessionId, key, windowsVirtualKeyCode) {
  await cdp.send(
    "Input.dispatchKeyEvent",
    { type: "keyDown", key, code: key, windowsVirtualKeyCode },
    sessionId,
  );
  await cdp.send(
    "Input.dispatchKeyEvent",
    { type: "keyUp", key, code: key, windowsVirtualKeyCode },
    sessionId,
  );
}
