export function chapterStars(stars: number): string {
  const count = Math.max(0, Math.min(3, Math.floor(stars)));
  return "★".repeat(count);
}
