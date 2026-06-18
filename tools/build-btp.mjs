import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const dist = path.join(root, "dist");
const approuterResources = path.join(root, "approuter", "resources");

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await rm(approuterResources, { recursive: true, force: true });

const entries = [
  "app.html",
  "index.html",
  "assets",
  "fiori",
  "docs"
];

for (const entry of entries) {
  const source = path.join(root, entry);
  if (!existsSync(source)) continue;
  await cp(source, path.join(dist, entry), { recursive: true });
}

const runtimeInfo = {
  application: "Autohaus HESSEN Management Suite",
  buildTarget: "SAP BTP HTML5 Apps Repository",
  generatedAt: new Date().toISOString(),
  entryPoint: "index.html"
};

await writeFile(path.join(dist, "btp-runtime.json"), JSON.stringify(runtimeInfo, null, 2));
await cp(dist, approuterResources, { recursive: true });
