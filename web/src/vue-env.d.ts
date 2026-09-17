/// <reference types="vite/client" />

declare module "*.md" {
  const html: string;
  export default html;
}

declare module "*.vue" {
  import type { DefineComponent } from "vue";

  const component: DefineComponent<Record<string, never>, Record<string, never>, unknown>;
  export default component;
}
