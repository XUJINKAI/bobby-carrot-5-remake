import fs from "node:fs";
import path from "node:path";

/**
 * 扫描 custom collection 的路径身份，并用 manifest 中的可选信息补充章节展示数据。
 * 目录结构是章节成员关系的唯一来源，避免 metadata 与实际文件布局漂移。
 */
export function discoverCollectionSource(collectionId, directory, rawChapterMetadata) {
  const chapterMetadata = validateChapterMetadata(collectionId, rawChapterMetadata);
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  const chapterIds = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      if (!isSlug(entry.name))
        throw new Error(`${collectionId}: 无效 chapter 目录 ID：${entry.name}`);
      return entry.name;
    })
    .sort((left, right) => left.localeCompare(right));
  const discoveredChapterIds = new Set(chapterIds);

  for (const chapterId of chapterMetadata.keys()) {
    if (!discoveredChapterIds.has(chapterId))
      throw new Error(`${collectionId}/${chapterId}: chapter 补充信息没有对应目录`);
  }

  const files = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => ({ directory, filename: entry.name }))
    .sort((left, right) => left.filename.localeCompare(right.filename));
  const chapters = chapterIds.map((id) => {
    const metadata = chapterMetadata.get(id);
    return {
      id,
      ...(metadata?.name !== undefined ? { name: metadata.name } : {}),
      ...(metadata?.description !== undefined
        ? { description: metadata.description }
        : {}),
    };
  });

  for (const chapter of chapters) {
    const chapterDirectory = path.join(directory, chapter.id);
    const chapterEntries = fs.readdirSync(chapterDirectory, { withFileTypes: true });
    const nestedDirectory = chapterEntries.find((entry) => entry.isDirectory());
    if (nestedDirectory)
      throw new Error(
        `${collectionId}/${chapter.id}/${nestedDirectory.name}: chapter 目录下不能再包含目录`,
      );
    files.push(...chapterEntries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
      .map((entry) => ({
        directory: chapterDirectory,
        filename: entry.name,
        chapter: chapter.id,
      }))
      .sort((left, right) => left.filename.localeCompare(right.filename)));
  }

  return { chapters, files };
}

function validateChapterMetadata(collectionId, value) {
  if (value === undefined) return new Map();
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error(`${collectionId}: chapters 必须是以目录 ID 为 key 的对象`);

  return new Map(Object.entries(value).map(([id, chapter]) => {
    if (!isSlug(id)) throw new Error(`${collectionId}: 无效 chapter 目录 ID：${id}`);
    if (!chapter || typeof chapter !== "object" || Array.isArray(chapter))
      throw new Error(`${collectionId}/${id}: chapter 补充信息必须是对象`);
    const { name, description } = chapter;
    if (name !== undefined && (typeof name !== "string" || !name.trim()))
      throw new Error(`${collectionId}/${id}: chapter name 不能为空`);
    if (description !== undefined && typeof description !== "string")
      throw new Error(`${collectionId}/${id}: chapter description 必须是字符串`);
    return [id, { name, description }];
  }));
}

function isSlug(value) {
  return typeof value === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}
