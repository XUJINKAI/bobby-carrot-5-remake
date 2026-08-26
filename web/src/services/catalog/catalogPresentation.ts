export function chapterStars(stars: number): string {
  return `${"★".repeat(stars)}${"☆".repeat(Math.max(0, 3 - stars))}`;
}
