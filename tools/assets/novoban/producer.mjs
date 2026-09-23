import fs from "node:fs";
import path from "node:path";
import { parseNovoban } from "./parser.mjs";

export function prepareNovobanCollection(repositoryRoot) {
  const text = fs.readFileSync(
    path.join(repositoryRoot, "tools/assets/novoban/NOVOBAN.txt"),
    "utf8",
  );
  const levels = parseNovoban(text);
  return {
    chapters: [],
    maps: levels.map((entry) => ({
      id: entry.id,
      document: {
        schemaVersion: 1,
        meta: {
          name: `${entry.id} · ${entry.title}`,
          author: entry.author,
        },
        ...entry.level,
      },
    })),
  };
}
