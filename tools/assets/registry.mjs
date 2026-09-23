import fs from "node:fs";
import path from "node:path";
import { buildRobo2Art } from "../custom/robo2/extract.mjs";
import { root } from "../lib/fs.mjs";
import {
  adaptBc5,
  decodeBc5,
  extractBc5,
  prepareBc5Collection,
  publishBc5Adventure,
  publishBc5Art,
} from "./bc5/producer.mjs";
import { prepareDirectoryCollection } from "./collection/directory-producer.mjs";
import {
  publishCollection,
  publishDiscoveryIndex,
} from "./collection/publisher.mjs";
import {
  readCollectionManifest,
  visibleCollectionSummaries,
} from "./collection/manifest.mjs";
import { prepareLomaCollection } from "./loma/producer.mjs";
import { prepareNovobanCollection } from "./novoban/producer.mjs";
import { publishDirectoryAtomically } from "./orchestrator/atomic-output.mjs";
import {
  adaptRobo2,
  decodeRobo2,
  extractRobo2,
  prepareAdaptedRobo2Collection,
} from "./robo2/producer.mjs";

export function createAssetRegistry({
  repositoryRoot = root,
  development = false,
} = {}) {
  const manifest = readCollectionManifest(repositoryRoot);
  const collectionByProducer = new Map(
    manifest.collections
      .filter((collection) => collection.producer !== "directory")
      .map((collection) => [collection.producer, collection]),
  );
  const stagingRoot = path.join(repositoryRoot, "tmp/assets/publish");
  const mapsRoot = path.join(repositoryRoot, "assets/maps");
  const tasks = [
    createBc5ExtractTask(repositoryRoot),
    createBc5DecodeTask(repositoryRoot),
    createBc5AdaptTask(repositoryRoot),
    collectionTask({
      id: "publish.collection.original",
      dependencies: ["bc5.adapt"],
      inputs: collectionPublisherInputs(),
      collection: requiredCollection(collectionByProducer, "bc5"),
      prepare: () => prepareBc5Collection(repositoryRoot),
      repositoryRoot,
      stagingRoot,
      mapsRoot,
    }),
    {
      id: "publish.adventure",
      dependencies: ["bc5.adapt"],
      inputs: ["tools/assets/bc5/producer.mjs"],
      outputs: ["assets/adventure/index.json"],
      run: () => publishBc5Adventure({ repositoryRoot, stagingRoot }),
    },
    {
      id: "publish.art.bc5",
      dependencies: ["bc5.adapt"],
      inputs: ["tools/assets/bc5/producer.mjs"],
      outputs: ["assets/art/hd"],
      run: () => publishBc5Art({ repositoryRoot, stagingRoot }),
    },
    createRobo2ExtractTask(repositoryRoot),
    createRobo2DecodeTask(repositoryRoot),
    createRobo2AdaptTask(repositoryRoot),
    collectionTask({
      id: "publish.collection.robo2",
      dependencies: ["robo2.adapt"],
      inputs: collectionPublisherInputs(),
      collection: requiredCollection(collectionByProducer, "robo2"),
      prepare: () => prepareAdaptedRobo2Collection(
        path.join(repositoryRoot, "tmp/assets/robo2/adapted"),
      ),
      repositoryRoot,
      stagingRoot,
      mapsRoot,
    }),
    createRobo2ArtTask(repositoryRoot, stagingRoot),
    collectionTask({
      id: "publish.collection.loma-pushbox",
      dependencies: [],
      inputs: [
        ...collectionPublisherInputs(),
        "tools/assets/loma",
        "tools/custom/LOMA.txt",
        "tools/custom/loma-pushbox.mjs",
        "tools/custom/sokoban-xsb.mjs",
        "tools/custom/pushbox-terrain.mjs",
        "tools/custom/pushbox-terrain-table.mjs",
        "model/src",
      ],
      collection: requiredCollection(collectionByProducer, "loma"),
      prepare: () => prepareLomaCollection(repositoryRoot),
      repositoryRoot,
      stagingRoot,
      mapsRoot,
    }),
    collectionTask({
      id: "publish.collection.novoban-pushbox",
      dependencies: [],
      inputs: [
        ...collectionPublisherInputs(),
        "tools/assets/novoban",
        "tools/custom/NOVOBAN.txt",
        "tools/custom/novoban-pushbox.mjs",
        "tools/custom/sokoban-xsb.mjs",
        "tools/custom/pushbox-terrain.mjs",
        "tools/custom/pushbox-terrain-table.mjs",
        "model/src",
      ],
      collection: requiredCollection(collectionByProducer, "novoban"),
      prepare: () => prepareNovobanCollection(repositoryRoot),
      repositoryRoot,
      stagingRoot,
      mapsRoot,
    }),
  ];

  const collectionTaskIds = tasks
    .filter((task) => task.id.startsWith("publish.collection."))
    .map((task) => task.id);
  for (const collection of manifest.collections.filter(
    (entry) => entry.producer === "directory",
  )) {
    const id = `publish.collection.${collection.id}`;
    tasks.push(collectionTask({
      id,
      dependencies: [],
      inputs: [
        ...collectionPublisherInputs(),
        "tools/assets/collection/directory-producer.mjs",
        "tools/custom/collection-source.mjs",
        collection.source,
        "model/src",
      ],
      collection,
      prepare: () => prepareDirectoryCollection(collection, repositoryRoot),
      repositoryRoot,
      stagingRoot,
      mapsRoot,
    }));
    collectionTaskIds.push(id);
  }

  tasks.push({
    id: "publish.discovery",
    dependencies: collectionTaskIds,
    inputs: [
      "tools/assets/collections.json",
      "tools/assets/collection/manifest.mjs",
      "tools/assets/collection/publisher.mjs",
    ],
    outputs: ["assets/maps/index.json"],
    fingerprint: `development=${development}`,
    run() {
      publishDiscoveryIndex({
        collections: visibleCollectionSummaries(manifest, development),
        outputRoot: mapsRoot,
      });
    },
  });

  return { manifest, tasks };
}

function createBc5ExtractTask(repositoryRoot) {
  return {
    id: "bc5.extract",
    dependencies: [],
    inputs: [
      "original/official-hd",
      "tools/original/extract.mjs",
      "tools/original/source-definitions.mjs",
      "tools/lib/zip.mjs",
    ],
    outputs: ["tmp/assets/bc5/extracted"],
    run: () => extractBc5(repositoryRoot),
  };
}

function createBc5DecodeTask(repositoryRoot) {
  return {
    id: "bc5.decode",
    dependencies: ["bc5.extract"],
    inputs: [
      "tools/original/decode.mjs",
      "tools/original/level-format.mjs",
      "tools/original/source-definitions.mjs",
      "tools/original/dat",
    ],
    outputs: ["tmp/assets/bc5/decoded"],
    run: () => decodeBc5(repositoryRoot),
  };
}

function createBc5AdaptTask(repositoryRoot) {
  return {
    id: "bc5.adapt",
    dependencies: ["bc5.decode"],
    inputs: [
      "model/src",
      "tools/original/adapt.mjs",
      "tools/original/adventure-catalog.mjs",
      "tools/original/entity-adapter.mjs",
      "tools/original/explore-filter-tags.mjs",
      "tools/original/public-ids.mjs",
      "tools/original/win-condition.mjs",
      "tools/original/lib/pipeline.mjs",
    ],
    outputs: ["tmp/assets/bc5/adapted"],
    run: () => adaptBc5(repositoryRoot),
  };
}

function createRobo2ExtractTask(repositoryRoot) {
  return {
    id: "robo2.extract",
    dependencies: [],
    inputs: [
      "tools/custom/robo2/robo2.jar",
      "tools/custom/robo2/archive.mjs",
      "tools/custom/robo2/format.mjs",
      "tools/assets/robo2/producer.mjs",
      "tools/lib/zip-patch.mjs",
    ],
    outputs: ["tmp/assets/robo2/extracted"],
    run: () => extractRobo2({
      repositoryRoot,
      outputDirectory: path.join(repositoryRoot, "tmp/assets/robo2/extracted"),
    }),
  };
}

function createRobo2DecodeTask(repositoryRoot) {
  return {
    id: "robo2.decode",
    dependencies: ["robo2.extract"],
    inputs: [
      "tools/custom/robo2/format.mjs",
      "tools/assets/robo2/producer.mjs",
    ],
    outputs: ["tmp/assets/robo2/decoded"],
    run: () => decodeRobo2({
      repositoryRoot,
      outputDirectory: path.join(repositoryRoot, "tmp/assets/robo2/decoded"),
    }),
  };
}

function createRobo2AdaptTask(repositoryRoot) {
  return {
    id: "robo2.adapt",
    dependencies: ["robo2.decode"],
    inputs: [
      "model/src",
      "tools/custom/robo2/convert.mjs",
      "tools/assets/robo2/producer.mjs",
    ],
    outputs: ["tmp/assets/robo2/adapted"],
    run: () => adaptRobo2({
      decodedDirectory: path.join(repositoryRoot, "tmp/assets/robo2/decoded"),
      outputDirectory: path.join(repositoryRoot, "tmp/assets/robo2/adapted"),
    }),
  };
}

function createRobo2ArtTask(repositoryRoot, stagingRoot) {
  return {
    id: "publish.art.robo2",
    dependencies: ["robo2.extract"],
    inputs: [
      "tools/custom/robo2/extract.mjs",
      "tools/custom/robo2/overrides",
    ],
    outputs: ["assets/art/robo2"],
    run() {
      const jar = fs.readFileSync(
        path.join(repositoryRoot, "tools/custom/robo2/robo2.jar"),
      );
      const art = buildRobo2Art(jar);
      publishDirectoryAtomically({
        stagingRoot,
        target: path.join(repositoryRoot, "assets/art/robo2"),
        write(directory) {
          for (const asset of art) {
            fs.writeFileSync(path.join(directory, asset.file), asset.content);
          }
        },
      });
    },
  };
}

function collectionTask({
  id,
  dependencies,
  inputs,
  collection,
  prepare,
  repositoryRoot,
  stagingRoot,
  mapsRoot,
}) {
  return {
    id,
    dependencies,
    inputs,
    outputs: [`assets/maps/${collection.id}`],
    run() {
      publishCollection({
        collection,
        prepared: prepare(),
        outputRoot: mapsRoot,
        stagingRoot,
      });
    },
  };
}

function collectionPublisherInputs() {
  return [
    "tools/assets/collections.json",
    "tools/assets/collection/manifest.mjs",
    "tools/assets/collection/publisher.mjs",
    "tools/assets/orchestrator/atomic-output.mjs",
  ];
}

function requiredCollection(collections, producer) {
  const collection = collections.get(producer);
  if (!collection) {
    throw new Error(`collection manifest 缺少 ${producer} producer`);
  }
  return collection;
}
