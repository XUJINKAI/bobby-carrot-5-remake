import MarkdownIt from "markdown-it";

const markdown = new MarkdownIt({ html: false, linkify: false });

export function renderHelpMarkdown(source: string): string {
  return markdown.render(source);
}
