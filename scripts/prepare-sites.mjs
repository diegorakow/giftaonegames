import { cp, mkdir, readdir, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const root = process.cwd();
const dist = resolve(root, "dist");
const tempClient = resolve(root, ".sites-static-client");
const client = join(dist, "client");
const server = join(dist, "server");
const openaiDist = join(dist, ".openai");

await rm(tempClient, { recursive: true, force: true });
await mkdir(tempClient, { recursive: true });

for (const entry of await readdir(dist, { withFileTypes: true })) {
  if (["client", "server", ".openai"].includes(entry.name)) {
    continue;
  }

  await cp(join(dist, entry.name), join(tempClient, entry.name), {
    recursive: true,
  });
}

await rm(client, { recursive: true, force: true });
await rm(server, { recursive: true, force: true });
await mkdir(client, { recursive: true });
await mkdir(server, { recursive: true });
await cp(tempClient, client, { recursive: true });

await writeFile(
  join(server, "index.js"),
  `const SPA_INDEX = "/index.html";

function shouldServeSpaFallback(request, response) {
  if (response.status !== 404) return false;
  if (request.method !== "GET" && request.method !== "HEAD") return false;

  const url = new URL(request.url);
  if (url.pathname.startsWith("/assets/")) return false;
  return !url.pathname.split("/").pop().includes(".");
}

export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);

    if (!shouldServeSpaFallback(request, response)) {
      return response;
    }

    const indexUrl = new URL(SPA_INDEX, request.url);
    return env.ASSETS.fetch(new Request(indexUrl, request));
  },
};
`
);

await mkdir(openaiDist, { recursive: true });
await cp(
  resolve(root, ".openai", "hosting.json"),
  join(openaiDist, "hosting.json")
);

await rm(tempClient, { recursive: true, force: true });
