export interface AdventureHomeView {
  nextLevelId: string | null;
  bonusCoins: number;
  goldenCarrots: number;
  goldenKey: boolean;
}

export interface AdventureChapterRow {
  number: number;
  title: string;
  stars: string;
  progress: string;
  unlocked: boolean;
}

export interface AdventureLevelRow {
  id: string;
  label: string;
  completed: boolean;
  unlocked: boolean;
  bonus: boolean;
}
