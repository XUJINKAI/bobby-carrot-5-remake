import fs from "node:fs";
import path from "node:path";
import { parseLoma } from "../../custom/loma-pushbox.mjs";

export function prepareLomaCollection(repositoryRoot) {
  const text = fs.readFileSync(
    path.join(repositoryRoot, "tools/custom/LOMA.txt"),
    "utf8",
  );
  const levels = parseLoma(text);
  return {
    chapters: Array.from({ length: 10 }, (_, index) => {
      const id = String(index + 1).padStart(2, "0");
      return { id, name: id };
    }),
    maps: levels.map((entry) => ({
      id: entry.id,
      chapter: entry.chapter,
      document: {
        schemaVersion: 1,
        meta: {
          name: entry.id,
          author: entry.author,
          ...(entry.comment ? { note: entry.comment } : {}),
        },
        ...entry.level,
      },
    })),
  };
}
