import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test } from "vitest";

const pocketBaseDir = path.resolve("deploy/pocketbase");

const HOST_REGISTER_RULE = [
  '@request.body.roles:length = 1',
  '@request.body.roles:each = "host"',
  '@request.body.account_status = "active"',
  "(@request.body.emailVisibility:isset = false || @request.body.emailVisibility = false)",
  "@request.body.verified:isset = false",
  "@request.body.verified_host:isset = false",
  "@request.body.balance:isset = false",
  "@request.body.rating:isset = false",
  "@request.body.reviews_count:isset = false",
  "@request.body.years_hosting:isset = false",
  "@request.body.staff_tasks:isset = false",
].join(" && ");

test("публичная регистрация пускает только хозяина и не открывает служебные поля", () => {
  const collections = JSON.parse(readFileSync(path.join(pocketBaseDir, "pb_schema.json"), "utf8")) as Array<{
    name?: string;
    createRule?: string | null;
  }>;
  const users = collections.find((item) => item.name === "users");
  expect(users?.createRule).toBe(HOST_REGISTER_RULE);

  const migration = readFileSync(
    path.join(pocketBaseDir, "pb_migrations/1792432000_users_host_register.js"),
    "utf8",
  );
  expect(migration).toContain(HOST_REGISTER_RULE);
});
