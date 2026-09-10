import path from "node:path";

const REPLAY_SITE_ORIGIN = "https://bc5r.xujinkai.net";
const MAP_SEGMENT = /^[a-z0-9][a-z0-9._-]*$/i;

/** Replay fixture 通过产品 URL 关联地图，文件路径只负责组织测试用例。 */
export function replayMapRef(replay) {
  const rawUrl = replay?.meta?.url;
  if (typeof rawUrl !== "string" || rawUrl.length === 0)
    throw new Error("Replay meta.url 必须是正式地图 URL");

  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("Replay meta.url 必须是有效 URL");
  }
  if (url.origin !== REPLAY_SITE_ORIGIN)
    throw new Error(`Replay meta.url 必须使用 ${REPLAY_SITE_ORIGIN}`);

  const match = url.pathname.match(
    /^\/explore\/play\/([^/]+)\/([^/]+)\/?$/,
  );
  if (!match)
    throw new Error("Replay meta.url 必须指向 Explore 地图页面");

  let collection;
  let id;
  try {
    collection = decodeURIComponent(match[1] ?? "");
    id = decodeURIComponent(match[2] ?? "");
  } catch {
    throw new Error("Replay meta.url 包含无效的地图路径编码");
  }
  if (!MAP_SEGMENT.test(collection) || !MAP_SEGMENT.test(id))
    throw new Error("Replay meta.url 包含无效的地图身份");
  return { collection, id };
}

export function replayMapFile(repositoryRoot, replay) {
  const { collection, id } = replayMapRef(replay);
  return path.join(
    repositoryRoot,
    "assets/maps",
    collection,
    `${id}.json`,
  );
}
