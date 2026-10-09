import "server-only";
import { z } from "zod";

const postgresqlUrl = z.url().refine(
  (value) => ["postgres:", "postgresql:"].includes(new URL(value).protocol),
  "Debe ser una URL de PostgreSQL.",
);
const optionalPostgresqlUrl = z.preprocess(
  (value) => (value === "" ? undefined : value),
  postgresqlUrl.optional(),
);

const environmentSchema = z.object({
  APP_ENV: z.enum(["development", "test", "preview", "production"]).default("development"),
  DATABASE_URL: postgresqlUrl,
  DIRECT_URL: optionalPostgresqlUrl,
  BETTER_AUTH_URL: z.url().default("http://localhost:3000"),
  BETTER_AUTH_SECRET: z.string().min(32, "BETTER_AUTH_SECRET debe tener al menos 32 caracteres."),
  APP_TIMEZONE: z.string().default("America/Lima"),
  APP_LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
});

export type Environment = z.infer<typeof environmentSchema>;

let cachedEnvironment: Environment | undefined;

export function getEnvironment(): Environment {
  if (cachedEnvironment) return cachedEnvironment;

  const result = environmentSchema.safeParse(process.env);
  if (!result.success) {
    const errors = result.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Configuración del servidor inválida: ${errors}`);
  }

  cachedEnvironment = result.data;
  return cachedEnvironment;
}

export const env = new Proxy({} as Environment, {
  get(_target, property: keyof Environment) {
    return getEnvironment()[property];
  },
});
