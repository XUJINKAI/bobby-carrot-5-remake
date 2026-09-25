export async function waitForBrowserState(check, timeoutMs = 10_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      if (await check()) return;
    } catch (error) {
      if (!isNavigationInProgress(error)) throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error("Browser regression interaction timed out");
}

function isNavigationInProgress(error) {
  return (
    error instanceof Error &&
    error.message === "Inspected target navigated or closed"
  );
}

export async function clickWhenPresent(cdp, sessionId, selector) {
  await waitForBrowserState(async () =>
    Boolean(
      await cdp.evaluate(
        sessionId,
        `(() => {
          const element = document.querySelector(${JSON.stringify(selector)});
          if (!element) return false;
          element.click();
          return true;
        })()`,
      ),
    ),
  );
}
