export const DEFAULT_EXCHANGE_ACCEPT = ".json,.bc5r,.txt,application/json,text/plain";

export async function readExchangeFile(file: File): Promise<string> {
  return file.text();
}

export function downloadExchangeText(options: {
  text: string;
  filename: string;
  compressed: boolean;
}): void {
  const extension = options.compressed ? ".bc5r" : ".json";
  const stem = options.filename.replace(/\.(?:json|bc5r)$/i, "");
  const blob = new Blob([options.text], {
    type: options.compressed ? "text/plain;charset=utf-8" : "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${stem}${extension}`;
  anchor.click();
  URL.revokeObjectURL(url);
}
