/** 解析 Engine 叠加层容器，并保证绝对定位以该容器为坐标系。 */
export function resolveGameplayMount(
  canvas: HTMLCanvasElement,
  root: HTMLElement | undefined,
  owner: string,
): HTMLElement {
  const mount = root ?? canvas.parentElement;
  if (!mount) throw new Error(`${owner} 需要可挂载的 Engine 容器`);
  if (window.getComputedStyle(mount).position === "static") {
    mount.style.position = "relative";
  }
  return mount;
}
