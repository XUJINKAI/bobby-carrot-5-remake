import { BC5R_GAME_ID } from "@bobby/model";
import { clickWhenPresent, waitForBrowserState } from "./browser-regression-wait.mjs";
import { verifyLayerReordering } from "./editor-layer-browser-checks.mjs";
import { verifyEditorCanvasPerformance } from "./editor-performance-browser.mjs";
import { replayLayout } from "./replay-browser-checks.mjs";

export async function verifyEditorExperience(cdp, sessionId) {
  await cdp.send(
    "Emulation.setDeviceMetricsOverride",
    { width: 1400, height: 900, deviceScaleFactor: 1, mobile: false },
    sessionId,
  );
  await cdp.send("Page.reload", {}, sessionId);
  await waitForBrowserState(
    async () =>
      Boolean(
        await cdp.evaluate(
          sessionId,
          "document.querySelector('.editor-canvas') && document.querySelector('[data-palette-type=\"egg\"]')",
        ),
      ),
    20_000,
  );
  await verifyLayerReordering(cdp, sessionId);
  await verifyLevelControls(cdp, sessionId);
  await verifyMetadataSync(cdp, sessionId);
  await verifySurfaceInspector(cdp, sessionId);
  await verifyPaletteTooltip(cdp, sessionId);
  await verifyEditorCanvasPerformance(cdp, sessionId);
  await verifyPlayControls(cdp, sessionId);
}

export async function verifyNarrowEditorStartsWithoutPanels(cdp, sessionId) {
  await cdp.send(
    "Emulation.setDeviceMetricsOverride",
    { width: 390, height: 760, deviceScaleFactor: 1, mobile: true },
    sessionId,
  );
  await cdp.send("Page.reload", {}, sessionId);
  await waitForBrowserState(
    async () =>
      Boolean(
        await cdp.evaluate(
          sessionId,
          "document.querySelector('.bobby-editor .editor-map-shell')",
        ),
      ),
    20_000,
  );
  const state = await cdp.evaluate(
    sessionId,
    `(() => {
      const root = document.querySelector('.bobby-editor');
      const visible = (selector) => {
        const element = document.querySelector(selector);
        return Boolean(element && getComputedStyle(element).display !== 'none');
      };
      return {
        paletteOpen: root?.classList.contains('palette-sheet-open'),
        inspectorOpen: root?.classList.contains('inspector-sheet-open'),
        paletteVisible: visible('.editor-palette'),
        surfaceVisible: visible('.editor-surface-panel'),
        inspectorVisible: visible('.editor-inspector'),
        levelVisible: visible('.editor-level-info'),
      };
    })()`,
  );
  if (Object.values(state).some(Boolean)) {
    throw new Error(`窄屏 Editor 初始显示了面板：${JSON.stringify(state)}`);
  }
}

async function verifyMetadataSync(cdp, sessionId) {
  await clickWhenPresent(cdp, sessionId, "#editor-level-info");
  await waitForBrowserState(async () =>
    Boolean(
      await cdp.evaluate(
        sessionId,
        "document.querySelector('[data-editor-metadata=\"name\"]')",
      ),
    ),
  );
  const original = await cdp.evaluate(
    sessionId,
    `(() => {
      return {
        name: document.querySelector('[data-editor-metadata="name"]')?.value ?? '',
        author: document.querySelector('[data-editor-metadata="author"]')?.value ?? '',
        note: document.querySelector('[data-editor-metadata="note"]')?.value ?? '',
      };
    })()`,
  );
  await clickWhenPresent(cdp, sessionId, "#editor-share");
  await waitForBrowserState(async () =>
    Boolean(
      await cdp.evaluate(
        sessionId,
        "document.querySelector('[data-editor-share-metadata=\"name\"]') && document.querySelector('.data-exchange-text')?.value",
      ),
    ),
  );
  await verifyDialogDragDoesNotDismiss(cdp, sessionId);
  await cdp.evaluate(
    sessionId,
    `(() => {
      const checkbox = document.querySelector('.data-exchange-check input[type="checkbox"]');
      if (checkbox?.checked) checkbox.click();
    })()`,
  );
  await waitForBrowserState(async () =>
    (await cdp.evaluate(
      sessionId,
      "document.querySelector('.data-exchange-text')?.value.trimStart().startsWith('{')",
    )) === true,
  );
  const expected = {
    name: "防抖联动地图",
    author: "联动作者",
    note: "第一行\n第二行",
  };
  const expectedDocumentMetadata = { game: BC5R_GAME_ID, ...expected };
  await cdp.evaluate(
    sessionId,
    `(values => {
      for (const [key, value] of Object.entries(values)) {
        const input = document.querySelector('[data-editor-share-metadata="' + key + '"]');
        input.value = value;
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    })(${JSON.stringify(expected)})`,
  );
  await waitForBrowserState(async () => {
    const metadata = await cdp.evaluate(
      sessionId,
      `(() => {
        try {
          return JSON.parse(document.querySelector('.data-exchange-text')?.value ?? '').meta;
        } catch {
          return null;
        }
      })()`,
    );
    return JSON.stringify(metadata) === JSON.stringify(expectedDocumentMetadata);
  });
  await cdp.evaluate(
    sessionId,
    "document.querySelector('[data-editor-dialog-close]')?.click(); true",
  );
  await waitForBrowserState(async () =>
    !await cdp.evaluate(
      sessionId,
      "Boolean(document.querySelector('.editor-dialog'))",
    ),
  );
  await waitForBrowserState(async () => {
    const current = await editorLevelMetadata(cdp, sessionId);
    return JSON.stringify(current) === JSON.stringify(expected);
  });
  await clickWhenPresent(cdp, sessionId, "#editor-undo");
  await waitForBrowserState(async () => {
    const current = await editorLevelMetadata(cdp, sessionId);
    return JSON.stringify(current) === JSON.stringify(original);
  });
  await clickWhenPresent(cdp, sessionId, "#editor-redo");
  await waitForBrowserState(async () => {
    const current = await editorLevelMetadata(cdp, sessionId);
    return JSON.stringify(current) === JSON.stringify(expected);
  });

  // 导入另一张完整 MapDocument 时，新文档自己的 meta 必须成为 authority。
  await clickWhenPresent(cdp, sessionId, "#editor-share");
  await waitForBrowserState(async () =>
    Boolean(
      await cdp.evaluate(
        sessionId,
        "document.querySelector('.editor-dialog .data-exchange-text')",
      ),
    ),
  );
  await cdp.evaluate(
    sessionId,
    `(() => {
      const checkbox = document.querySelector('.editor-dialog .data-exchange-check input[type="checkbox"]');
      if (checkbox?.checked) checkbox.click();
    })()`,
  );
  await waitForBrowserState(async () =>
    (await cdp.evaluate(
      sessionId,
      "document.querySelector('.editor-dialog .data-exchange-text')?.value.trimStart().startsWith('{')",
    )) === true,
  );
  const importedMetadata = {
    name: "导入地图 B",
    author: "Bob",
    note: "B 的注记",
  };
  const applied = await cdp.evaluate(
    sessionId,
    `(metadata => {
      const textarea = document.querySelector('.editor-dialog .data-exchange-text');
      if (!textarea) return false;
      const documentValue = JSON.parse(textarea.value);
      documentValue.meta = metadata;
      textarea.value = JSON.stringify(documentValue, null, 2);
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      const apply = document.querySelector(
        '.editor-dialog [data-exchange-action="importText"]',
      );
      apply?.click();
      return Boolean(apply);
    })(${JSON.stringify(importedMetadata)})`,
  );
  if (!applied) throw new Error("Editor 地图文件应用按钮不存在");
  await waitForBrowserState(async () =>
    !await cdp.evaluate(
      sessionId,
      "Boolean(document.querySelector('.editor-dialog'))",
    ),
  );
  await waitForBrowserState(async () => {
    const current = await editorLevelMetadata(cdp, sessionId);
    return JSON.stringify(current) === JSON.stringify(importedMetadata);
  });
  await clickWhenPresent(cdp, sessionId, "#editor-inspector");
}

async function verifyDialogDragDoesNotDismiss(cdp, sessionId) {
  const points = await cdp.evaluate(
    sessionId,
    `(() => {
      const layer = document.querySelector('.editor-dialog-layer');
      const dialog = document.querySelector('.editor-dialog');
      if (!layer || !dialog) return null;
      const layerRect = layer.getBoundingClientRect();
      const dialogRect = dialog.getBoundingClientRect();
      return {
        inside: {
          x: dialogRect.left + dialogRect.width / 2,
          y: dialogRect.top + 24,
        },
        backdrop: {
          x: layerRect.left + 4,
          y: layerRect.top + 4,
        },
      };
    })()`,
  );
  if (!points) throw new Error("Editor Share Dialog 无法测量");

  await cdp.send(
    "Input.dispatchMouseEvent",
    {
      type: "mousePressed",
      x: points.inside.x,
      y: points.inside.y,
      button: "left",
      buttons: 1,
      clickCount: 1,
    },
    sessionId,
  );
  await cdp.send(
    "Input.dispatchMouseEvent",
    {
      type: "mouseMoved",
      x: points.backdrop.x,
      y: points.backdrop.y,
      button: "left",
      buttons: 1,
    },
    sessionId,
  );
  await cdp.send(
    "Input.dispatchMouseEvent",
    {
      type: "mouseReleased",
      x: points.backdrop.x,
      y: points.backdrop.y,
      button: "left",
      buttons: 0,
      clickCount: 1,
    },
    sessionId,
  );
  await new Promise((resolve) => setTimeout(resolve, 100));
  const remainsOpen = await cdp.evaluate(
    sessionId,
    "Boolean(document.querySelector('.editor-dialog'))",
  );
  if (!remainsOpen)
    throw new Error("Editor Share Dialog 被从面板内部开始的拖拽关闭");
}

async function editorLevelMetadata(cdp, sessionId) {
  return cdp.evaluate(
    sessionId,
    `(() => ({
      name: document.querySelector('[data-editor-metadata="name"]')?.value ?? '',
      author: document.querySelector('[data-editor-metadata="author"]')?.value ?? '',
      note: document.querySelector('[data-editor-metadata="note"]')?.value ?? '',
    }))()`,
  );
}

async function verifyLevelControls(cdp, sessionId) {
  await clickWhenPresent(cdp, sessionId, "#editor-level-info");
  await waitForBrowserState(async () =>
    Boolean(
      await cdp.evaluate(
        sessionId,
        "document.querySelector('[data-editor-music]')",
      ),
    ),
  );
  const initial = await cdp.evaluate(
    sessionId,
    `(() => ({
      music: document.querySelector('[data-editor-music]')?.value,
      musicPreview: document.querySelector('[data-editor-music-preview]')?.textContent?.trim(),
      language: document.documentElement.lang,
      modes: [...document.querySelectorAll('[data-rule-mode]')]
        .map((button) => button.getAttribute('data-rule-mode')),
      active: document.querySelector('[data-rule-mode][aria-pressed="true"]')
        ?.getAttribute('data-rule-mode'),
    }))()`,
  );
  const previewLabel = initial.language === "zh-CN" ? "试听" : "Preview";
  const stopLabel = initial.language === "zh-CN" ? "停止试听" : "Stop";
  if (
    initial.music !== "random" ||
    initial.musicPreview !== previewLabel ||
    JSON.stringify(initial.modes) !== JSON.stringify(["any", "all"]) ||
    initial.active !== "all"
  ) {
    throw new Error(`Editor Level 控件初始状态异常：${JSON.stringify(initial)}`);
  }
  await cdp.evaluate(
    sessionId,
    "document.querySelector('[data-editor-music-preview]')?.click(); true",
  );
  await waitForBrowserState(async () =>
    (await cdp.evaluate(
      sessionId,
      "document.querySelector('[data-editor-music-preview]')?.textContent?.trim()",
    )) === stopLabel,
  );
  await cdp.evaluate(
    sessionId,
    "document.querySelector('[data-editor-music-preview]')?.click(); true",
  );
  await waitForBrowserState(async () =>
    (await cdp.evaluate(
      sessionId,
      "document.querySelector('[data-editor-music-preview]')?.textContent?.trim()",
    )) === previewLabel,
  );
  await cdp.evaluate(
    sessionId,
    `(() => {
      const select = document.querySelector('[data-editor-music]');
      select.value = 'shop';
      select.dispatchEvent(new Event('change', { bubbles: true }));
    })()`,
  );
  await waitForBrowserState(async () =>
    (await cdp.evaluate(
      sessionId,
      "document.querySelector('[data-editor-music]')?.value",
    )) === "shop",
  );
  await cdp.evaluate(
    sessionId,
    `(() => {
      const select = document.querySelector('[data-editor-music]');
      select.value = '';
      select.dispatchEvent(new Event('change', { bubbles: true }));
      document.querySelector('[data-rule-mode="any"]')?.click();
    })()`,
  );
  await waitForBrowserState(async () =>
    (await cdp.evaluate(
      sessionId,
      "document.querySelector('[data-rule-mode=\"any\"]')?.getAttribute('aria-pressed')",
    )) === "true",
  );
  await cdp.evaluate(
    sessionId,
    "document.querySelector('[data-rule-mode=\"all\"]')?.click(); true",
  );
  await waitForBrowserState(async () =>
    (await cdp.evaluate(
      sessionId,
      "document.querySelector('[data-rule-mode=\"all\"]')?.getAttribute('aria-pressed')",
    )) === "true",
  );
  await clickWhenPresent(cdp, sessionId, "#editor-inspector");
}

async function verifySurfaceInspector(cdp, sessionId) {
  await cdp.evaluate(
    sessionId,
    "document.querySelector('#editor-surface')?.click(); true",
  );
  await waitForBrowserState(async () =>
    Boolean(
      await cdp.evaluate(
        sessionId,
        "document.querySelector('.editor-surface-panel')",
      ),
    ),
  );
  const point = await cdp.evaluate(
    sessionId,
    `(() => {
      const canvas = document.querySelector('.editor-canvas');
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      return {
        x: rect.left + rect.width / 32,
        y: rect.top + rect.height / 32,
      };
    })()`,
  );
  if (!point) throw new Error("Editor canvas was not measurable");
  await cdp.send(
    "Input.dispatchMouseEvent",
    {
      type: "mousePressed",
      x: point.x,
      y: point.y,
      button: "left",
      clickCount: 1,
    },
    sessionId,
  );
  await cdp.send(
    "Input.dispatchMouseEvent",
    {
      type: "mouseReleased",
      x: point.x,
      y: point.y,
      button: "left",
      clickCount: 1,
    },
    sessionId,
  );
  await waitForBrowserState(async () =>
    Number(
      await cdp.evaluate(
        sessionId,
        "document.querySelectorAll('.editor-layer-card .editor-surface-variant-btn').length",
      ),
    ) > 1,
  );
  const snapshot = await cdp.evaluate(
    sessionId,
    `(() => {
      const card = document.querySelector('.editor-layer-card');
      const active = card?.querySelector('.editor-surface-variant-btn.active');
      const next = [...(card?.querySelectorAll('.editor-surface-variant-btn') ?? [])]
        .find((button) => button !== active);
      const nextTitle = next?.getAttribute('title') ?? '';
      next?.click();
      return {
        selects: card?.querySelectorAll('select').length ?? -1,
        nextTitle,
        text: document.body.textContent ?? '',
      };
    })()`,
  );
  if (snapshot.selects !== 0 || !snapshot.nextTitle) {
    throw new Error("Surface Inspector did not expose a visual-only variant grid");
  }
  if (snapshot.text.includes("使用未注册 type")) {
    throw new Error("Editor reported an unregistered canonical Entity type");
  }
  await waitForBrowserState(async () =>
    (await cdp.evaluate(
      sessionId,
      "document.querySelector('.editor-layer-card .editor-surface-variant-btn.active')?.getAttribute('title') ?? ''",
    )) === snapshot.nextTitle,
  );
}

async function verifyPaletteTooltip(cdp, sessionId) {
  await cdp.evaluate(
    sessionId,
    "document.querySelector('#editor-palette')?.click(); true",
  );
  await waitForBrowserState(async () =>
    Boolean(
      await cdp.evaluate(
        sessionId,
        "document.querySelector('[data-palette-type=\"egg\"]')",
      ),
    ),
  );
  const point = await cdp.evaluate(
    sessionId,
    `(() => {
      const button = document.querySelector('[data-palette-type="egg"]');
      if (!button) return null;
      const rect = button.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    })()`,
  );
  if (!point) throw new Error("Egg Palette item was not measurable");
  await cdp.send(
    "Input.dispatchMouseEvent",
    { type: "mouseMoved", x: point.x, y: point.y },
    sessionId,
  );
  await waitForBrowserState(async () =>
    Boolean(
      await cdp.evaluate(
        sessionId,
        "document.querySelector('.editor-material-tooltip')",
      ),
    ),
  );
  const tooltip = await cdp.evaluate(
    sessionId,
    `(() => {
      const element = document.querySelector('.editor-material-tooltip');
      return {
        name: element?.querySelector('strong')?.textContent ?? '',
        type: element?.querySelector('code')?.textContent ?? '',
      };
    })()`,
  );
  if (tooltip.name !== "Egg" || tooltip.type !== "egg") {
    throw new Error(`Egg Palette tooltip was incorrect: ${JSON.stringify(tooltip)}`);
  }
}

async function verifyPlayControls(cdp, sessionId) {
  await clickWhenPresent(cdp, sessionId, "#editor-play");
  await waitForBrowserState(
    async () =>
      Boolean(
        await cdp.evaluate(
          sessionId,
          `(() => {
            const replay = document.querySelector('#editor-replay-record');
            return replay && !replay.disabled &&
              document.querySelector('#screen-control') &&
              document.querySelector('[data-replay-panel]') &&
              !document.querySelector('#editor-palette') &&
              !document.querySelector('#editor-inspector');
          })()`,
        ),
      ),
    20_000,
  );
  await clickWhenPresent(cdp, sessionId, "#editor-replay-record");
  await waitForBrowserState(async () =>
    Boolean(
      await cdp.evaluate(
        sessionId,
        "!document.querySelector('[data-replay-panel]')?.hidden",
      ),
    ),
  );
  const layout = await replayLayout(cdp, sessionId);
  if (layout.canvasLeft < layout.panelRight - 1) {
    throw new Error("Editor Replay panel did not reserve canvas space");
  }
  const builtinReplayVisible = await cdp.evaluate(
    sessionId,
    "Boolean(document.querySelector('[data-replay-action=\"load-builtin\"]'))",
  );
  if (builtinReplayVisible) {
    throw new Error("Editor Replay panel exposed an unrelated builtin replay action");
  }
  await cdp.evaluate(
    sessionId,
    "document.querySelector('[data-replay-action=\"record\"]')?.click(); true",
  );
  await waitForBrowserState(async () =>
    Boolean(await cdp.evaluate(
      sessionId,
      "document.querySelector('[data-replay-panel]')?.classList.contains('recording')",
    )),
  );
  await cdp.evaluate(
    sessionId,
    "document.querySelector('[data-replay-action=\"record\"]')?.click(); true",
  );

  const joystickWasHidden = await cdp.evaluate(
    sessionId,
    "Boolean(document.querySelector('.engine-screen-joystick-layer')?.hidden)",
  );
  await clickWhenPresent(cdp, sessionId, "#screen-control");
  await waitForBrowserState(async () =>
    (await cdp.evaluate(
      sessionId,
      "Boolean(document.querySelector('.engine-screen-joystick-layer')?.hidden)",
    )) !== joystickWasHidden,
  );
}
