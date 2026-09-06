import fs from "node:fs";
import path from "node:path";
import {
  ENTITY_MAP_DEFINITIONS,
  ENTITY_MAP_INDEXED_FAMILIES,
  LEVEL_ENTITY_RESERVED_FIELDS,
  entityMapDefinition,
} from "@bobby/model";
import { root } from "../lib/fs.mjs";

const requestedType = process.argv[2];

if (requestedType) {
  const definition = entityMapDefinition(requestedType);
  if (!definition) throw new Error(`Unknown map entity type: ${requestedType}`);
  process.stdout.write(
    `${JSON.stringify(
      {
        contract: contractView(definition),
        examples: examplesForDefinition(definition),
      },
      null,
      2,
    )}\n`,
  );
} else {
  const outputDir = path.join(root, "tmp/schema");
  fs.mkdirSync(outputDir, { recursive: true });

  const contract = {
    schemaVersion: 1,
    reservedFields: [...LEVEL_ENTITY_RESERVED_FIELDS],
    entities: Object.fromEntries(
      Object.values(ENTITY_MAP_DEFINITIONS).map((definition) => [
        definition.type,
        contractView(definition),
      ]),
    ),
    indexedFamilies: ENTITY_MAP_INDEXED_FAMILIES.map((family) => ({
      pattern: indexedFamilyPattern(family),
      min: family.min,
      max: family.max,
      fields: fieldMap(family.fields),
    })),
  };

  const examples = {
    schemaVersion: 1,
    entities: Object.fromEntries(
      Object.values(ENTITY_MAP_DEFINITIONS).map((definition) => [
        definition.type,
        examplesForDefinition(definition),
      ]),
    ),
    indexedFamilies: ENTITY_MAP_INDEXED_FAMILIES.map((family) => {
      const sampleType = `${family.prefix}${String(family.min).padStart(
        family.digits,
        "0",
      )}`;
      const definition = entityMapDefinition(sampleType);
      if (!definition)
        throw new Error(`Failed to resolve indexed entity family: ${sampleType}`);
      return {
        pattern: indexedFamilyPattern(family),
        sampleType,
        examples: examplesForDefinition(definition),
      };
    }),
  };

  const contractPath = path.join(outputDir, "entity-map-contract.json");
  const examplesPath = path.join(outputDir, "entity-map-examples.json");
  fs.writeFileSync(contractPath, `${JSON.stringify(contract, null, 2)}\n`);
  fs.writeFileSync(examplesPath, `${JSON.stringify(examples, null, 2)}\n`);
  console.log(path.relative(root, contractPath));
  console.log(path.relative(root, examplesPath));
}

function contractView(definition) {
  return { fields: fieldMap(definition.fields) };
}

function fieldMap(fields) {
  return Object.fromEntries(
    fields.map((field) => {
      const { key, ...contract } = field;
      return [key, contract];
    }),
  );
}

function examplesForDefinition(definition) {
  const baseline = {
    type: definition.type,
    x: 0,
    y: 0,
  };

  for (const field of definition.fields) {
    if (field.default !== undefined) baseline[field.key] = field.default;
  }

  const examples = [baseline];
  for (const field of definition.fields) {
    for (const value of reviewValues(field)) {
      if (baseline[field.key] === value) continue;
      examples.push({ ...baseline, [field.key]: value });
    }
  }
  return dedupeExamples(examples);
}

function reviewValues(field) {
  if (field.kind === "enum") return field.values;
  if (field.kind === "boolean") return [false, true];
  if (field.kind === "integer" || field.kind === "number") {
    const values = [];
    if (field.default !== undefined) values.push(field.default);
    if (field.min !== undefined) values.push(field.min);
    if (field.max !== undefined) values.push(field.max);
    return values;
  }
  return field.default !== undefined ? [field.default] : [];
}

function dedupeExamples(examples) {
  const seen = new Set();
  return examples.filter((example) => {
    const key = JSON.stringify(example);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function indexedFamilyPattern(family) {
  return `${family.prefix}${"N".repeat(family.digits)}`;
}
