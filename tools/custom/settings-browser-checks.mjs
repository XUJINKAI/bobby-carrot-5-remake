import { waitForBrowserState } from "./browser-regression-wait.mjs";

export async function verifySettingsPage(cdp, sessionId) {
  await waitForBrowserState(async () =>
    Boolean(await cdp.evaluate(sessionId, "document.querySelector('.settings-page')")),
  );
  await cdp.evaluate(
    sessionId,
    `(() => {
      localStorage.setItem('bc5r:adventure', JSON.stringify({
        schemaVersion: 1,
        game: 'https://github.com/XUJINKAI/bobby-carrot-5-remake',
        campaign: {
          completedThrough: {},
          completedEvents: [],
          resumeLevelId: '1-1'
        },
        economy: { bonusCoins: 0, goldenCarrots: 0 },
        items: []
      }));
      localStorage.setItem('bc5r:explore/original', JSON.stringify({
        schemaVersion: 1,
        game: 'https://github.com/XUJINKAI/bobby-carrot-5-remake',
        completedMaps: ['1-1'],
        lastMap: '1-1'
      }));
      localStorage.setItem('bc5r:explore/custom', JSON.stringify({
        schemaVersion: 1,
        game: 'https://github.com/XUJINKAI/bobby-carrot-5-remake',
        completedMaps: []
      }));
      location.reload();
      return true;
    })()`,
  );
  await waitForBrowserState(async () =>
    (await cdp.evaluate(
      sessionId,
      "document.querySelectorAll('.save-management-tabs [role=tab]').length",
    )) === 3,
  );

  const snapshot = await cdp.evaluate(
    sessionId,
    `(() => ({
      tabs: [...document.querySelectorAll('.save-management-tabs [role=tab]')]
        .map((tab) => ({ label: tab.textContent?.trim(), selected: tab.getAttribute('aria-selected') })),
      panels: document.querySelectorAll('.data-exchange-panel').length,
      draft: document.querySelector('.data-exchange-text')?.value ?? '',
      draftHeight: document.querySelector('.data-exchange-text')?.getBoundingClientRect().height ?? 0
    }))()`,
  );
  if (
    snapshot.tabs.map((tab) => tab.label).join(",") !==
      "Adventure,Explore / custom,Explore / original" ||
    snapshot.tabs[0]?.selected !== "true" ||
    snapshot.panels !== 1 ||
    snapshot.draftHeight < 350 ||
    !snapshot.draft.includes('"campaign"')
  ) {
    throw new Error("Settings save management did not derive tabs from storage");
  }

  await cdp.evaluate(
    sessionId,
    `document.getElementById('save-tab-explore:original').click(); true`,
  );
  await waitForBrowserState(async () =>
    String(
      await cdp.evaluate(
        sessionId,
        "document.querySelector('.data-exchange-text')?.value ?? ''",
      ),
    ).includes('"completedMaps"'),
  );
  const selectedDraft = await cdp.evaluate(
    sessionId,
    "document.querySelector('.data-exchange-text')?.value ?? ''",
  );
  if (selectedDraft.includes('"campaign"'))
    throw new Error("Settings Explore tab did not switch the shared exchange panel");
}
