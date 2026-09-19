import { webT } from "../../i18n/webI18n.js";

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
    : `<p>${escapeHtml(webT("game.totalCoins", { total: details.totalCoins }))}</p>`;
  const nextAttributes = details.nextId
    ? ` data-next="${escapeHtml(details.nextId)}"`
    : " disabled";
  return [
    `<h2>${escapeHtml(webT("game.complete"))}</h2>`,
    '<div class="result-statistics">',
    `<p>${escapeHtml(webT("game.time", { time: formatElapsed(details.elapsedMs) }))}</p>`,
    `<p>${escapeHtml(webT("game.moves", { moves: details.moves }))}</p>`,
    `<p>${escapeHtml(webT("game.coins", { collected: details.collectedCoins, available: details.availableCoins }))}</p>`,
    totalCoins,
    "</div>",
    '<div class="result-actions">',
    `<button class="ghost-btn" data-result="levels">${escapeHtml(webT("game.back"))}</button>`,
    `<button class="primary-btn" data-result="next"${nextAttributes}>${escapeHtml(webT("game.next"))}</button>`,
    "</div>",
  ].join("");
}

export function failedResultHtml(): string {
  return [
    `<h2>${escapeHtml(webT("game.failed"))}</h2>`,
    '<div class="result-actions">',
    `<button class="ghost-btn" data-result="levels">${escapeHtml(webT("game.back"))}</button>`,
    `<button class="primary-btn" data-result="retry">${escapeHtml(webT("game.retry"))}</button>`,
    "</div>",
  ].join("");
}
