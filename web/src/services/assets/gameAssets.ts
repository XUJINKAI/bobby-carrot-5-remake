import {
  createOriginalGameplayImageManager,
  registerRobo2GameplayImages,
  type ImageManager,
} from "@bobby/engine";

export function siteUrl(path: string): string {
  return new URL(path.replace(/^\/+/, ""), document.baseURI).href;
}

export function publicBaseUrl(): string {
  return import.meta.env.VITE_PUBLIC_BASE_URL || new URL(".", document.baseURI).href;
}

export function createImageManager(): ImageManager {
  const images = createOriginalGameplayImageManager((file) =>
    siteUrl(`assets/art/hd/${file}`),
  );
  images.registerSource("original-title", siteUrl("assets/art/hd/title.png"));
  images.registerSource("original-train", siteUrl("assets/art/hd/train.png"));
  images.registerSource("original-misc", siteUrl("assets/art/hd/misc.png"));
  registerRobo2GameplayImages(images, (file) =>
    siteUrl(`assets/art/robo2/${file}`)
  );
  return images;
}
