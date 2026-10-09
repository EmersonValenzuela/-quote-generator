import { describe, expect, it } from "vitest";
import { assertSafeSeedTarget, describeDatabaseTarget } from "./seed-policy";

describe("seed safety policy", () => {
  it("requires an explicit bootstrap opt-in in production", () => {
    expect(() =>
      assertSafeSeedTarget({
        applicationEnvironment: "production",
        mode: "bootstrap",
        allowProduction: false,
        databaseHost: "db.example",
        databaseName: "quotes",
      }),
    ).toThrow(/SEED_ALLOW_PRODUCTION=true/);
  });

  it("rejects demo seed in production-like destinations", () => {
    expect(() =>
      assertSafeSeedTarget({
        applicationEnvironment: "development",
        mode: "demo",
        allowProduction: false,
        databaseHost: "db.production.example",
        databaseName: "quotes_development",
      }),
    ).toThrow(/modo demo requiere/);
  });

  it("accepts demo only in a dedicated development database", () => {
    expect(() =>
      assertSafeSeedTarget({
        applicationEnvironment: "development",
        mode: "demo",
        allowProduction: false,
        databaseHost: "localhost",
        databaseName: "quotes_development",
      }),
    ).not.toThrow();
  });

  it("reports a target without exposing URL credentials", () => {
    expect(
      describeDatabaseTarget("postgresql://private:secret@localhost:5432/quotes_development"),
    ).toEqual({ host: "localhost", database: "quotes_development" });
  });
});
