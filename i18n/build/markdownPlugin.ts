import MarkdownIt from "markdown-it";
import type { Plugin } from "vite";

const markdown = new MarkdownIt({ html: false, linkify: false });

export function renderMarkdown(source: string): string {
  return markdown.render(source);
}

export function markdownPlugin(): Plugin {
  return {
    name: "bc5r-i18n-markdown",
    enforce: "pre",
    transform(source, id) {
      if (!id.split("?", 1)[0]?.endsWith(".md")) return null;
      return {
        code: `export default ${JSON.stringify(renderMarkdown(source))};`,
        map: null,
      };
    },
  };
}
