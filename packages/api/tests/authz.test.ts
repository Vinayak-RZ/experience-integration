import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { RoleSchema } from "@stamped/l6-contracts";
import {
  AuthzError,
  PermissionSchema,
  can,
  matrixEntries,
  requirePermission,
} from "../src/authz/index.js";

describe("RBAC permission matrix", () => {
  it("covers every role × every permission (fail-closed)", () => {
    const entries = matrixEntries();
    assert.equal(
      entries.length,
      RoleSchema.options.length * PermissionSchema.length,
    );
    for (const entry of entries) {
      assert.equal(can(entry.role, entry.permission), entry.allowed);
    }
  });

  it("denies CFO alarm ack and sustainability alarm writes", () => {
    assert.equal(can("cfo", "alarm:ack"), false);
    assert.equal(can("sustainability", "alarm:ack"), false);
    assert.equal(can("sustainability", "alarm:silence"), false);
  });

  it("allows operator alarm actions and denies admin-only routes", () => {
    assert.equal(can("operator", "alarm:ack"), true);
    assert.equal(can("operator", "route:admin"), false);
    assert.equal(can("operator", "admin:users"), false);
  });

  it("allows admin users and integrations", () => {
    assert.equal(can("admin", "admin:users"), true);
    assert.equal(can("admin", "admin:integrations"), true);
    assert.equal(can("admin", "route:admin"), true);
  });

  it("requirePermission fails closed for unknown role", () => {
    assert.throws(
      () => requirePermission("hacker", "alarm:ack"),
      (err: unknown) => err instanceof AuthzError,
    );
  });

  it("requirePermission fails closed for missing permission", () => {
    assert.throws(
      () => requirePermission("cfo", "alarm:ack"),
      (err: unknown) =>
        err instanceof AuthzError && err.permission === "alarm:ack",
    );
  });

  it("cross-role matrix: ledger read vs alarm write", () => {
    assert.equal(can("cfo", "ledger:read"), true);
    assert.equal(can("operator", "ledger:read"), false);
    assert.equal(can("energy_manager", "alarm:ack"), false);
    assert.equal(can("supervisor", "prescription:act"), true);
  });
});
