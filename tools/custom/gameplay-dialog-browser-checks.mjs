import { waitForBrowserState } from "./browser-regression-wait.mjs";

/** 在真实浏览器里验证纯对话 View 的逐字展示、选项导航与结果返回。 */
export async function verifyGameplayDialogKeyboard(
  cdp,
  sessionId,
  moduleUrl,
) {
  await cdp.evaluate(
    sessionId,
    `(() => {
      window.__gameplayDialogCheck = { ready: false };
      import(${JSON.stringify(moduleUrl)}).then(({ GameplayDialogView }) => {
        const canvas = document.querySelector('#game');
        const mount = canvas?.parentElement;
        if (!canvas || !mount) throw new Error('Gameplay canvas is missing');
        const dialog = new GameplayDialogView(
          canvas,
          { root: mount, characterIntervalMs: 200 },
        );
        dialog.root.dataset.browserDialogCheck = 'true';
        const state = window.__gameplayDialogCheck;
        Object.assign(state, { ready: true, dialog, result: null });
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
  await dispatchDialogInput(cdp, sessionId, {
    type: "confirm",
    source: "keyboard",
  });
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
  await dispatchDialogInput(cdp, sessionId, {
    type: "direction",
    source: "arrows",
    direction: "right",
  });
  await expectSelected(cdp, sessionId, "third");
  await dispatchDialogInput(cdp, sessionId, {
    type: "direction",
    source: "arrows",
    direction: "left",
  });
  await dispatchDialogInput(cdp, sessionId, {
    type: "direction",
    source: "arrows",
    direction: "left",
  });
  await expectSelected(cdp, sessionId, "first");
  await dispatchDialogInput(cdp, sessionId, {
    type: "confirm",
    source: "keyboard",
  });

  await waitForBrowserState(async () =>
    Boolean(
      await cdp.evaluate(
        sessionId,
        `(() => {
          const state = window.__gameplayDialogCheck;
          return state?.result?.type === 'selected' &&
            state.result.optionId === 'first' &&
            state.dialog.root.hidden;
        })()`,
      ),
    ),
  );
  await cdp.evaluate(
    sessionId,
    `(() => {
      const state = window.__gameplayDialogCheck;
      state.passiveResult = null;
      void state.dialog.show('提示').then((result) => {
        state.passiveResult = result;
      });
      return true;
    })()`,
  );
  await dispatchDialogInput(cdp, sessionId, {
    type: "confirm",
    source: "keyboard",
  });
  await dispatchDialogInput(cdp, sessionId, {
    type: "confirm",
    source: "keyboard",
  });
  await waitForBrowserState(async () =>
    Boolean(
      await cdp.evaluate(
        sessionId,
        `window.__gameplayDialogCheck?.passiveResult?.type === 'dismissed' &&
          window.__gameplayDialogCheck.dialog.root.hidden`,
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

async function dispatchDialogInput(cdp, sessionId, input) {
  await cdp.evaluate(
    sessionId,
    `window.__gameplayDialogCheck.dialog.handleInput(${JSON.stringify(input)}); true`,
  );
}
