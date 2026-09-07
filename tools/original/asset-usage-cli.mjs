import {
  formatOriginalTsUsage,
  formatOriginalTemporarySurfaceUsage,
  loadOriginalTsUsage,
  loadOriginalTemporarySurfaceUsage,
} from "./asset-usage.mjs";

const args = process.argv.slice(2);
const json = args.includes("--json");
const temporary = args.includes("--temporary");
const query = args.find((arg) => !arg.startsWith("--"));
if (!query && !temporary)
  throw new Error(
    "用法：node tools/cli.mjs original usage ts-4-13 [--json]",
  );

const result = temporary
  ? loadOriginalTemporarySurfaceUsage()
  : loadOriginalTsUsage(query);
process.stdout.write(
  json
    ? `${JSON.stringify(result, null, 2)}\n`
    : temporary
      ? formatOriginalTemporarySurfaceUsage(result)
      : formatOriginalTsUsage(result),
);
