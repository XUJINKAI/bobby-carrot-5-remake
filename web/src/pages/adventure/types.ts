export interface AdventureHomeView {
  resumeLevelId: string;
  resumeChapterTitle: string;
  bonusCoins: number;
  goldenCarrots: number;
}

export interface AdventureChapterRow {
  number: number;
  title: string;
  stars: string;
  completed: boolean;
}

export interface AdventureLevelRow {
  id: string;
  completed: boolean;
  unlocked: boolean;
}
