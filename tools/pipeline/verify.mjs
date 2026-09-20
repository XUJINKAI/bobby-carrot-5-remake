import { run } from "../lib/fs.mjs";
import { verifySeoArtifacts } from "./seo-verify.mjs";
import { verifyWebPerformanceArtifacts } from "./web-performance-verify.mjs";

run(process.execPath, ["tools/pipeline/source-quality.mjs"]);
run(process.execPath, ["tools/cli.mjs", "test"]);
run(process.execPath, ["tools/cli.mjs", "build"]);
run(process.execPath, ["--test", "tests/smoke/build/artifacts.test.mjs"]);
run(process.execPath, ["--test", "tests/smoke/browser/browser.test.mjs"]);
verifySeoArtifacts();
verifyWebPerformanceArtifacts();

console.log("verify: OK — 源码、测试、构建、Browser、SEO 与性能验收通过。");
