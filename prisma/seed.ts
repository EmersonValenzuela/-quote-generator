import { PrismaPg } from "@prisma/adapter-pg";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { z } from "zod";
import { PrismaClient } from "../src/generated/prisma/client";
import {
  assertSafeSeedTarget,
  describeDatabaseTarget,
  type ApplicationEnvironment,
  type SeedMode,
} from "../src/lib/seed/seed-policy";

const seedEnvironmentSchema = z.object({
  APP_ENV: z.enum(["development", "test", "preview", "production"]).default("development"),
  DATABASE_URL: z.url().refine(
    (value) => ["postgres:", "postgresql:"].includes(new URL(value).protocol),
    "Debe ser una URL de PostgreSQL.",
  ),
  DIRECT_URL: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.url()
      .refine(
        (value) => ["postgres:", "postgresql:"].includes(new URL(value).protocol),
        "Debe ser una URL de PostgreSQL.",
      )
      .optional(),
  ),
  BETTER_AUTH_SECRET: z.string().min(32),
  SEED_MODE: z.enum(["bootstrap", "demo"]),
  SEED_ALLOW_PRODUCTION: z.enum(["true", "false"]).default("false"),
  SEED_ADMIN_NAME: z.string().trim().min(1).max(120),
  SEED_ADMIN_EMAIL: z.email(),
  SEED_ADMIN_PASSWORD: z.string().min(12).max(128),
});

const units = [
  { code: "UND", label: "Unidad" },
  { code: "M", label: "Metro" },
  { code: "M2", label: "Metro cuadrado" },
  { code: "KG", label: "Kilogramo" },
  { code: "SERV", label: "Servicio" },
] as const;

function readSeedEnvironment() {
  const parsed = seedEnvironmentSchema.safeParse(process.env);
  if (!parsed.success) {
    const errors = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`No se puede ejecutar el seed: ${errors}`);
  }

  const databaseConnection = parsed.data.DIRECT_URL ?? parsed.data.DATABASE_URL;
  const target = describeDatabaseTarget(databaseConnection);
  assertSafeSeedTarget({
    applicationEnvironment: parsed.data.APP_ENV as ApplicationEnvironment,
    mode: parsed.data.SEED_MODE as SeedMode,
    allowProduction: parsed.data.SEED_ALLOW_PRODUCTION === "true",
    databaseHost: target.host,
    databaseName: target.database,
  });

  return { ...parsed.data, databaseConnection, target };
}

async function ensureInitialAdministrator(
  prisma: PrismaClient,
  input: { name: string; email: string; password: string; secret: string },
): Promise<void> {
  const normalizedEmail = input.email.trim().toLowerCase();
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, role: true },
  });

  if (existingUser) {
    if (existingUser.role === "admin") return;
    throw new Error(
      "El correo inicial ya pertenece a un usuario que no es administrador. No se cambiará su rol ni contraseña.",
    );
  }

  const administratorExists = await prisma.user.findFirst({
    where: { role: "admin" },
    select: { id: true },
  });
  if (administratorExists) {
    throw new Error(
      "Ya existe un administrador inicial. No se creó otro ni se modificó su contraseña.",
    );
  }

  const bootstrapAuth = betterAuth({
    appName: "Cotizador",
    baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
    secret: input.secret,
    database: prismaAdapter(prisma, { provider: "postgresql" }),
    emailAndPassword: {
      enabled: true,
      disableSignUp: false,
      requireEmailVerification: false,
      minPasswordLength: 12,
      maxPasswordLength: 128,
    },
    user: {
      additionalFields: {
        mustChangePassword: {
          type: "boolean",
          defaultValue: true,
          required: false,
          input: false,
        },
        isActive: {
          type: "boolean",
          defaultValue: true,
          required: false,
          input: false,
        },
      },
    },
    advanced: { database: { generateId: "uuid" } },
  });

  const created = await bootstrapAuth.api.signUpEmail({
    body: {
      name: input.name.trim(),
      email: normalizedEmail,
      password: input.password,
    },
  });

  if (!created.user?.id) {
    throw new Error("Better Auth no devolvió el administrador recién creado.");
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: created.user.id },
      data: { role: "admin", mustChangePassword: true, isActive: true },
    }),
    prisma.session.deleteMany({ where: { userId: created.user.id } }),
  ]);
}

async function main(): Promise<void> {
  const environment = readSeedEnvironment();
  const adapter = new PrismaPg({ connectionString: environment.databaseConnection });
  const prisma = new PrismaClient({ adapter });

  try {
    await prisma.$transaction(async (transaction) => {
      await transaction.companySettings.upsert({
        where: { id: "main" },
        create: { id: "main" },
        update: {},
      });

      for (const unit of units) {
        await transaction.unitOfMeasure.upsert({
          where: { code: unit.code },
          create: unit,
          update: { label: unit.label, isActive: true },
        });
      }

      if (environment.SEED_MODE === "demo") {
        const demoCustomers = [
          {
            id: "demo-customer-constructor",
            name: "Constructora de Prueba S.A.C.",
            documentType: "RUC",
            documentNumber: "00000000000",
            contactName: "Contacto sintético",
            phone: "000 000 000",
          },
          {
            id: "demo-customer-persona",
            name: "Cliente de Prueba",
            documentType: "DNI",
            documentNumber: "00000000",
            contactName: "Cliente de Prueba",
            phone: "000 000 000",
          },
        ];

        for (const customer of demoCustomers) {
          await transaction.customer.upsert({
            where: { id: customer.id },
            create: customer,
            update: {},
          });
        }
      }
    });

    await ensureInitialAdministrator(prisma, {
      name: environment.SEED_ADMIN_NAME,
      email: environment.SEED_ADMIN_EMAIL,
      password: environment.SEED_ADMIN_PASSWORD,
      secret: environment.BETTER_AUTH_SECRET,
    });

    console.info(
      JSON.stringify({
        event: "seed.completed",
        mode: environment.SEED_MODE,
        databaseHost: environment.target.host,
        databaseName: environment.target.database,
      }),
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(
    JSON.stringify({
      event: "seed.failed",
      error:
        error instanceof Error
          ? error.message.replace(
              /(postgres(?:ql)?:\/\/)[^@\s]+@/gi,
              "$1[redacted]@",
            )
          : "Error desconocido del seed.",
    }),
  );
  process.exitCode = 1;
});
