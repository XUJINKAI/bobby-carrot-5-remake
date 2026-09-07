import {
  formatOriginalTsUsage,
  loadOriginalTsUsage,
} from "./asset-usage.mjs";

const args = process.argv.slice(2);
const json = args.includes("--json");
const query = args.find((arg) => !arg.startsWith("--"));
if (!query)
  throw new Error("用法：npm run original:usage -- ts-4-13 [--json]");

const result = loadOriginalTsUsage(query);
process.stdout.write(
  json
    ? `${JSON.stringify(result, null, 2)}\n`
    : formatOriginalTsUsage(result),
);
