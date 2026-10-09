export type SeedMode = "bootstrap" | "demo";
export type ApplicationEnvironment = "development" | "test" | "preview" | "production";

export interface SeedTarget {
  applicationEnvironment: ApplicationEnvironment;
  mode: SeedMode;
  allowProduction: boolean;
  databaseHost: string;
  databaseName: string;
}

export function assertSafeSeedTarget(target: SeedTarget): void {
  if (target.applicationEnvironment === "production") {
    if (target.mode !== "bootstrap" || !target.allowProduction) {
      throw new Error(
        "En producción solo se permite SEED_MODE=bootstrap con SEED_ALLOW_PRODUCTION=true.",
      );
    }
    return;
  }

  if (target.allowProduction) {
    throw new Error("SEED_ALLOW_PRODUCTION solo se admite en APP_ENV=production.");
  }

  if (target.mode === "demo") {
    const dedicatedDatabaseName = /(?:^|[_-])(demo|test|development)(?:$|[_-])/i.test(
      target.databaseName,
    );
    const productionLikeHost = /(?:^|[.-])prod(?:uction)?(?:$|[.-])/i.test(
      target.databaseHost,
    );

    if (
      !["development", "test"].includes(target.applicationEnvironment) ||
      !dedicatedDatabaseName ||
      productionLikeHost
    ) {
      throw new Error(
        "El modo demo requiere APP_ENV=development o test y una base cuyo nombre indique demo, test o development.",
      );
    }
  }
}

export function describeDatabaseTarget(connectionString: string): {
  host: string;
  database: string;
} {
  const url = new URL(connectionString);
  return {
    host: url.hostname,
    database: decodeURIComponent(url.pathname.replace(/^\/+/, "")),
  };
}
