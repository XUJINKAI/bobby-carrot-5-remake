import assert from "node:assert/strict";
import { test } from "vitest";
import {
  canonicalExploreReplayUrl,
  canonicalReplayUrl,
  editorMapPath,
  editorPathWithoutMapHash,
  exploreCollectionPath,
  parseEditorMapHash,
  replayAssetUrl,
} from "../src/app/routes.ts";

test("original collection uses the canonical explore path", () => {
  assert.equal(exploreCollectionPath("original"), "/explore");
  assert.equal(exploreCollectionPath("novoban-pushbox"), "/explore/novoban-pushbox");
});

test("replay asset mirrors the map collection and id", () => {
  assert.equal(
    replayAssetUrl("original", "1-1"),
    "/assets/replays/original/1-1.json",
  );
});

test("replay metadata uses the canonical site origin", () => {
  assert.equal(
    canonicalReplayUrl({
      pathname: "/explore/play/original/1-1",
      search: "?mode=test",
      hash: "#note",
    }),
    "https://bc5r.xujinkai.net/explore/play/original/1-1?mode=test#note",
  );
});

test("Adventure recording resolves metadata to its referenced Explore map", () => {
  assert.equal(
    canonicalExploreReplayUrl({ collection: "original", id: "1-1" }),
    "https://bc5r.xujinkai.net/explore/play/original/1-1",
  );
});

test("editor map source is encoded in the URL fragment", () => {
  assert.equal(
    editorMapPath({ collection: "original", id: "1-1" }),
    "/edit#map=original/1-1",
  );
  assert.deepEqual(parseEditorMapHash("#map=original/1-1"), {
    collection: "original",
    id: "1-1",
  });
});

test("editor map fragment rejects malformed references", () => {
  assert.equal(parseEditorMapHash("#map=original"), null);
  assert.equal(parseEditorMapHash("#map=original/1-1/extra"), null);
  assert.equal(parseEditorMapHash("#other=value"), null);
});

test("editor consumes the map fragment while preserving path and query", () => {
  assert.equal(
    editorPathWithoutMapHash({ pathname: "/edit", search: "?grid=on" }),
    "/edit?grid=on",
  );
});
