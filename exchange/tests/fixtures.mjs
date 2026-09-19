import { BC5R_GAME_ID } from "@bobby/model";

export const levelMapFixture = {
  schemaVersion: 1,
  width: 2,
  height: 1,
  entities: [
    { type: "grass", x: 0, y: 0, variant: "ts-10-1" },
    { type: "bobby", x: 0, y: 0 },
  ],
};

export const mapDocumentFixture = {
  ...levelMapFixture,
  meta: { game: BC5R_GAME_ID, name: "Shared Map", author: "Bobby" },
};

export const scopedSaveFixtures = [
  {
    game: BC5R_GAME_ID,
    schemaVersion: 1,
    scope: "adventure",
  },
  {
    game: BC5R_GAME_ID,
    schemaVersion: 1,
    scope: "explore/original",
    completedMaps: [],
  },
];
