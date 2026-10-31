/** @vitest-environment node */
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, test } from "vitest";
import { loadServerEnv } from "./loadServerEnv.ts";

test("подхватывает пустую переменную из .env.local и не затирает уже заданную", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "env-local-"));
  await writeFile(path.join(dir, ".env.local"), "TEST_LOAD_ENV_FLAG=from-file\nTEST_LOAD_ENV_KEEP=file\n", "utf8");
  const previousFlag = process.env.TEST_LOAD_ENV_FLAG;
  const previousKeep = process.env.TEST_LOAD_ENV_KEEP;
  delete process.env.TEST_LOAD_ENV_FLAG;
  process.env.TEST_LOAD_ENV_KEEP = "process";
  try {
    loadServerEnv(dir);
    expect(process.env.TEST_LOAD_ENV_FLAG).toBe("from-file");
    expect(process.env.TEST_LOAD_ENV_KEEP).toBe("process");
  } finally {
    if (previousFlag === undefined) {
      delete process.env.TEST_LOAD_ENV_FLAG;
    } else {
      process.env.TEST_LOAD_ENV_FLAG = previousFlag;
    }
    if (previousKeep === undefined) {
      delete process.env.TEST_LOAD_ENV_KEEP;
    } else {
      process.env.TEST_LOAD_ENV_KEEP = previousKeep;
    }
  }
});
