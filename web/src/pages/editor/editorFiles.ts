import {
  parseEditorLevel,
  serializeEditorLevel,
  type EditorLevel,
} from "@bobby/editor";

export async function readEditorFile(file: File): Promise<EditorLevel> {
  return parseEditorLevel(await file.text());
}

export function downloadEditorFile(level: EditorLevel): void {
  const blob = new Blob([serializeEditorLevel(level)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${safeFilename(level.name)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function safeFilename(name: string): string {
  return name.replace(/[^\p{L}\p{N}._-]+/gu, "-").replace(/^-+|-+$/g, "") || "bobby-level";
}
