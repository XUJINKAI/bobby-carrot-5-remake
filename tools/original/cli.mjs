import fs from "node:fs";
import path from "node:path";
import { root, run, tscCommand } from "../lib/fs.mjs";

const [action, ...actionArgs] = process.argv.slice(2);

if (action === "extract") {
  const { extractOriginal } = await import("./archive/extract.mjs");
  extractOriginal();
} else if (action === "decode") {
  buildModel();
  const { decodeOriginal } = await import("./archive/decode.mjs");
  decodeOriginal();
} else if (action === "adapt") {
  buildModel();
  await adaptOriginal();
} else if (action === "prepare") {
  buildModel();
  const [{ extractOriginal }, { decodeOriginal }] = await Promise.all([
    import("./archive/extract.mjs"),
    import("./archive/decode.mjs"),
  ]);
  extractOriginal();
  decodeOriginal();
  await adaptOriginal();
} else if (action === "inspect") {
  buildModel();
  const { inspectOriginal } = await import("./commands/inspect.mjs");
  inspectOriginal({ showAll: actionArgs.includes("--all") });
} else if (action === "patch") {
  run(tscCommand(), ["-b", "model", "--force"]);
  if (!fs.existsSync(path.join(root, "tmp/assets/bc5/adapted/catalog.json"))) {
    const [{ extractOriginal }, { decodeOriginal }] = await Promise.all([
      import("./archive/extract.mjs"),
      import("./archive/decode.mjs"),
    ]);
    extractOriginal();
    decodeOriginal();
    await adaptOriginal();
  }
  const { patchOriginal } = await import("./commands/patch.mjs");
  patchOriginal(actionArgs);
} else if (action === "research") {
  const { researchOriginal } = await import("./commands/research.mjs");
  researchOriginal(actionArgs);
} else {
  throw new Error(
    "用法：node tools/cli.mjs original extract|decode|adapt|prepare|inspect|patch|research",
  );
}

function buildModel() {
  run(tscCommand(), ["-b", "model"]);
}

async function adaptOriginal() {
  const [{ adaptOriginal: adapt }, { buildOriginalAdventure }] =
    await Promise.all([
      import("./adapter/adapt.mjs"),
      import("./catalog/adventure.mjs"),
    ]);
  adapt();
  buildOriginalAdventure();
}
