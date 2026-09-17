import MarkdownIt from "markdown-it";
import type { Plugin } from "vite";

const markdown = new MarkdownIt({ html: false, linkify: false });

export function renderBuildMarkdown(source: string): string {
  return markdown.render(source);
}

/** 仓库维护的 Markdown 在 Vite 变换阶段生成 HTML，浏览器只接收结果字符串。 */
export function markdownHtmlPlugin(): Plugin {
  return {
    name: "bc5r-markdown-html",
    enforce: "pre",
    transform(source, id) {
      if (!id.split("?", 1)[0]?.endsWith(".md")) return null;
      return {
        code: `export default ${JSON.stringify(renderBuildMarkdown(source))};`,
        map: null,
      };
    },
  };
}
