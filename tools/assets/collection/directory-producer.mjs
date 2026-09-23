import fs from "node:fs";
import path from "node:path";
import { discoverCollectionSource } from "../../custom/collection-source.mjs";

export function prepareDirectoryCollection(collection, repositoryRoot) {
  const directory = path.join(repositoryRoot, collection.source);
  if (!fs.existsSync(directory)) {
    throw new Error(`${collection.id}: collection 目录不存在`);
  }
  const { chapters, files } = discoverCollectionSource(
    collection.id,
    directory,
    collection.chapters,
  );
  const maps = files.map(({ directory: mapDirectory, filename, chapter }) => {
    const id = path.basename(filename, ".json");
    return {
      id,
      ...(chapter ? { chapter } : {}),
      document: JSON.parse(
        fs.readFileSync(path.join(mapDirectory, filename), "utf8"),
      ),
    };
  });
  return { chapters, maps };
}
