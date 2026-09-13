export interface AdventureHomeView {
  resumeLevelId: string;
  resumeChapterTitle: string;
  bonusCoins: number;
}

export interface AdventureChapterRow {
  number: number;
  title: string;
  difficulty: number;
  completed: boolean;
}

export interface AdventureLevelRow {
  id: string;
  completed: boolean;
  unlocked: boolean;
}

/** Night Train 只消费目的地描述；具体目的地是否可进入、进入哪里由外层策略决定。 */
export interface AdventureNightTrainDestination {
  id: string;
  label: string;
  href?: string;
  note?: string;
}
