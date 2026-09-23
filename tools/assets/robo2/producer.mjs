import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { serializeMapDocument } from "@bobby/model";
import { readZipEntry } from "../../lib/zip-patch.mjs";
import {
  assertRobo2A1Archive,
  decodeRobo2Archive,
  ROBO2_LEVEL_TITLES,
} from "../../custom/robo2/archive.mjs";
import { convertRobo2Level } from "../../custom/robo2/convert.mjs";
import {
  decodeRobo2LevelRecord,
  encodeRobo2LevelRecord,
} from "../../custom/robo2/format.mjs";

export function extractRobo2({ repositoryRoot, outputDirectory }) {
  const source = robo2SourceFile(repositoryRoot);
  const jar = fs.readFileSync(source);
  const archive = assertRobo2A1Archive(decodeRobo2Archive(jar));
  replaceDirectory(outputDirectory, (directory) => {
    writeJson(path.join(directory, "archive.json"), {
      schemaVersion: 1,
      source: "tools/custom/robo2/robo2.jar",
      sha256: archive.sha256,
      entries: archive.levels.map((level) => `data/${level.index}`),
    });
  });
}

export function decodeRobo2({ repositoryRoot, outputDirectory }) {
  const jar = fs.readFileSync(robo2SourceFile(repositoryRoot));
  assertRobo2A1Archive(decodeRobo2Archive(jar));
  replaceDirectory(outputDirectory, (directory) => {
    for (let index = 0; index < ROBO2_LEVEL_TITLES.length; index += 1) {
      const entry = `data/${index}`;
      const record = readZipEntry(jar, entry);
      const decoded = decodeRobo2LevelRecord(record, entry);
      const encoded = encodeRobo2LevelRecord(decoded, entry);
      if (!Buffer.from(encoded).equals(record)) {
        throw new Error(`${entry}: Robo 2 encode round-trip 不一致`);
      }
      const id = String(index + 1).padStart(2, "0");
      writeJson(path.join(directory, `${id}.json`), {
        schemaVersion: 1,
        source: {
          entry,
          recordSha256: crypto
            .createHash("sha256")
            .update(record)
            .digest("hex"),
        },
        title: ROBO2_LEVEL_TITLES[index],
        width: decoded.width,
        height: decoded.height,
        theme: decoded.theme,
        tiles: decoded.tiles,
      });
    }
  });
}

export function adaptRobo2({ decodedDirectory, outputDirectory }) {
  replaceDirectory(outputDirectory, (directory) => {
    for (let index = 0; index < ROBO2_LEVEL_TITLES.length; index += 1) {
      const id = String(index + 1).padStart(2, "0");
      const decoded = readJson(path.join(decodedDirectory, `${id}.json`));
      const document = convertRobo2Level(decoded, {
        id,
        title: decoded.title,
      });
      fs.writeFileSync(
        path.join(directory, `${id}.json`),
        serializeMapDocument(document),
      );
    }
  });
}

export function prepareAdaptedRobo2Collection(adaptedDirectory) {
  return {
    chapters: [],
    maps: ROBO2_LEVEL_TITLES.map((_, index) => {
      const id = String(index + 1).padStart(2, "0");
      return {
        id,
        document: readJson(path.join(adaptedDirectory, `${id}.json`)),
      };
    }),
  };
}

function robo2SourceFile(repositoryRoot) {
  return path.join(repositoryRoot, "tools/custom/robo2/robo2.jar");
}

function replaceDirectory(directory, write) {
  fs.rmSync(directory, { recursive: true, force: true });
  fs.mkdirSync(directory, { recursive: true });
  write(directory);
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}
