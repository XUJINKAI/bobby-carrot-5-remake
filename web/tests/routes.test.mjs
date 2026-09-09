import assert from "node:assert/strict";
import { test } from "vitest";
import {
  editorMapPath,
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
