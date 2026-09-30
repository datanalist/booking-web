/** @vitest-environment node */
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { createDataStoreMiddleware } from "./createDataStoreMiddleware.ts";

let dataDir: string;
let baseUrl: string;
let closeServer: () => Promise<void>;

async function startServer(): Promise<void> {
  dataDir = await mkdtemp(path.join(tmpdir(), "datastore-test-"));
  const middleware = createDataStoreMiddleware({ dataDir, maxBytes: 1024 });

  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    middleware(req, res, () => {
      res.statusCode = 404;
      res.end("fallback");
    });
  });

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve());
  });

  const address = server.address();
  if (address === null || typeof address === "string") {
    throw new Error("server address missing");
  }
  baseUrl = `http://127.0.0.1:${address.port}`;
  closeServer = () =>
    new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
}

beforeEach(async () => {
  await startServer();
});

afterEach(async () => {
  await closeServer();
  await rm(dataDir, { recursive: true, force: true });
});

describe("createDataStoreMiddleware", () => {
  test("POST saves file and GET returns it; DELETE removes", async () => {
    const payload = Buffer.from([0xff, 0xd8, 0xff, 0xd9]);
    const post = await fetch(`${baseUrl}/api/files`, {
      method: "POST",
      headers: { "Content-Type": "image/jpeg" },
      body: payload,
    });
    expect(post.status).toBe(201);
    const json: unknown = await post.json();
    expect(json).toEqual({
      url: expect.stringMatching(
        /^\/data\/[0-9a-f-]{36}\.jpg$/,
      ),
    });
    const url =
      typeof json === "object" &&
      json !== null &&
      "url" in json &&
      typeof json.url === "string"
        ? json.url
        : "";
    const fileName = url.slice("/data/".length);

    const files = await readdir(dataDir);
    expect(files).toContain(fileName);
    expect(await readFile(path.join(dataDir, fileName))).toEqual(payload);

    const get = await fetch(`${baseUrl}${url}`);
    expect(get.status).toBe(200);
    expect(get.headers.get("content-type")).toBe("image/jpeg");
    expect(Buffer.from(await get.arrayBuffer())).toEqual(payload);

    const del = await fetch(`${baseUrl}/api/files/${fileName}`, {
      method: "DELETE",
    });
    expect(del.status).toBe(200);
    expect(await readdir(dataDir)).not.toContain(fileName);

    const getMissing = await fetch(`${baseUrl}${url}`);
    expect(getMissing.status).toBe(404);
  });

  test("rejects invalid GET names and oversized POST", async () => {
    const traversal = await fetch(
      `${baseUrl}/data/${encodeURIComponent("../secret.jpg")}`,
    );
    expect(traversal.status).toBe(400);

    const badName = await fetch(`${baseUrl}/data/not-uuid.jpg`);
    expect(badName.status).toBe(400);

    const huge = await fetch(`${baseUrl}/api/files`, {
      method: "POST",
      headers: { "Content-Type": "image/png" },
      body: Buffer.alloc(2048, 1),
    });
    expect(huge.status).toBe(413);
  });

  test("DELETE rejects traversal and non-uuid names", async () => {
    await writeFile(path.join(dataDir, "keep.txt"), "x");
    const traversal = await fetch(
      `${baseUrl}/api/files/${encodeURIComponent("../keep.txt")}`,
      { method: "DELETE" },
    );
    expect(traversal.status).toBe(400);

    const bad = await fetch(`${baseUrl}/api/files/not-a-uuid.jpg`, {
      method: "DELETE",
    });
    expect(bad.status).toBe(400);
  });
});
