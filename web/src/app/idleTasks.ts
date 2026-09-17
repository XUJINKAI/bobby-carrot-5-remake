export type CancelIdleTask = () => void;

/**
 * 低优先级预取只在页面完成当前渲染后开始；不支持 Idle Callback 的浏览器使用短延时降级。
 */
export function scheduleIdleTask(
  task: () => void | Promise<void>,
  timeoutMs = 2_000,
): CancelIdleTask {
  let cancelled = false;
  const run = (): void => {
    if (cancelled) return;
    void Promise.resolve(task()).catch((error) => {
      console.warn("空闲预取失败", error);
    });
  };

  if (typeof window.requestIdleCallback === "function") {
    const handle = window.requestIdleCallback(run, { timeout: timeoutMs });
    return () => {
      cancelled = true;
      window.cancelIdleCallback(handle);
    };
  }

  const handle = window.setTimeout(run, Math.min(timeoutMs, 200));
  return () => {
    cancelled = true;
    window.clearTimeout(handle);
  };
}
