export function escapeHtml(value: string): string {
  const entities: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
  };

  return value.replace(/[&<>\"]/g, (char) => entities[char] ?? char);
}

export function formatElapsed(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export interface CompletedResultDetails {
  elapsedMs: number;
  moves: number;
  collectedCoins: number;
  availableCoins: number;
  totalCoins?: number;
  nextId?: string;
}

export function completedResultHtml(details: CompletedResultDetails): string {
  const totalCoins = details.totalCoins === undefined
    ? ""
    : `<p>总金币: ${details.totalCoins}</p>`;
  const nextAttributes = details.nextId
    ? ` data-next="${escapeHtml(details.nextId)}"`
    : " disabled";
  return [
    "<h2>关卡完成！</h2>",
    '<div class="result-statistics">',
    `<p>用时: ${formatElapsed(details.elapsedMs)}</p>`,
    `<p>步数: ${details.moves}</p>`,
    `<p>金币: ${details.collectedCoins}/${details.availableCoins}</p>`,
    totalCoins,
    "</div>",
    '<div class="result-actions">',
    '<button class="ghost-btn" data-result="levels">返回</button>',
    `<button class="primary-btn" data-result="next"${nextAttributes}>下一关</button>`,
    "</div>",
  ].join("");
}

export function failedResultHtml(): string {
  return [
    "<h2>失败</h2>",
    '<div class="result-actions">',
    '<button class="ghost-btn" data-result="levels">返回</button>',
    '<button class="primary-btn" data-result="retry">重新开始</button>',
    "</div>",
  ].join("");
}
