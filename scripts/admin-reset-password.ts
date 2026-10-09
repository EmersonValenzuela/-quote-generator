import "dotenv/config";
import { randomUUID } from "node:crypto";
import { stdin, stdout } from "node:process";
import { emitKeypressEvents } from "node:readline";
import { createInterface } from "node:readline/promises";
import { PrismaPg } from "@prisma/adapter-pg";
import { z } from "zod";
import { PrismaClient } from "../src/generated/prisma/client";
import { resetAdministratorPassword } from "../src/lib/auth/admin-password-reset";

const environmentSchema = z.object({
  APP_ENV: z.enum(["development", "test", "preview", "production"]).default("development"),
  DATABASE_URL: z.url().refine(
    (value) => ["postgres:", "postgresql:"].includes(new URL(value).protocol),
    "DATABASE_URL debe ser una URL de PostgreSQL.",
  ),
  DIRECT_URL: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z
      .url()
      .refine((value) => ["postgres:", "postgresql:"].includes(new URL(value).protocol))
      .optional(),
  ),
});

function readHidden(prompt: string): Promise<string> {
  if (!stdin.isTTY || typeof stdin.setRawMode !== "function") {
    return Promise.reject(new Error("Ejecuta la recuperación desde una terminal interactiva."));
  }

  return new Promise((resolve, reject) => {
    const wasRaw = stdin.isRaw;
    let value = "";

    function finish(error?: Error) {
      stdin.off("keypress", onKeypress);
      stdin.setRawMode(wasRaw);
      stdin.pause();
      stdout.write("\n");
      if (error) reject(error);
      else resolve(value);
    }

    function onKeypress(character: string, key: { name?: string; ctrl?: boolean }) {
      if (key.ctrl && key.name === "c") {
        finish(new Error("Operación cancelada."));
      } else if (key.name === "return" || key.name === "enter") {
        finish();
      } else if (key.name === "backspace") {
        value = value.slice(0, -1);
      } else if (character && !key.ctrl) {
        value += character;
      }
    }

    emitKeypressEvents(stdin);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.on("keypress", onKeypress);
    stdout.write(prompt);
  });
}

async function main(): Promise<void> {
  const parsedEnvironment = environmentSchema.safeParse(process.env);
  if (!parsedEnvironment.success) {
    const problems = parsedEnvironment.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Configuración inválida: ${problems}`);
  }

  const connectionString =
    parsedEnvironment.data.DIRECT_URL ?? parsedEnvironment.data.DATABASE_URL;
  const databaseTarget = new URL(connectionString);
  const databaseName = decodeURIComponent(databaseTarget.pathname.replace(/^\/+/, ""));

  console.log("Recuperación local de contraseña del administrador");
  console.log(`Destino: ${databaseTarget.hostname} / ${databaseName}`);
  console.log("Se invalidarán sus sesiones y se exigirá cambiar la contraseña al ingresar.");
  if (parsedEnvironment.data.APP_ENV === "production") {
    console.log("ATENCIÓN: APP_ENV=production. Confirma solo si este destino es intencional.");
  }

  const prompt = createInterface({ input: stdin, output: stdout });
  let confirmation: string;
  let email: string;
  try {
    const expectedConfirmation =
      parsedEnvironment.data.APP_ENV === "production" ? "RESET PRODUCTION" : "RESET";
    confirmation = await prompt.question(`Escribe "${expectedConfirmation}" para continuar: `);
    if (confirmation !== expectedConfirmation) {
      throw new Error("Confirmación incorrecta; no se realizaron cambios.");
    }
    email = z.email().parse((await prompt.question("Correo del administrador: ")).trim().toLowerCase());
  } finally {
    prompt.close();
  }

  const newPassword = await readHidden("Nueva contraseña (entrada oculta): ");
  const confirmationPassword = await readHidden("Confirma la nueva contraseña: ");
  if (newPassword.length < 12 || newPassword.length > 128) {
    throw new Error("La contraseña debe tener entre 12 y 128 caracteres.");
  }
  if (newPassword !== confirmationPassword) {
    throw new Error("Las contraseñas no coinciden; no se realizaron cambios.");
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });
  const requestId = randomUUID();

  try {
    const administrator = await prisma.user.findUnique({
      where: { email },
      select: { id: true, role: true },
    });
    if (!administrator || administrator.role !== "admin") {
      throw new Error("No se encontró una cuenta administradora con ese correo.");
    }

    await resetAdministratorPassword(prisma, administrator.id, newPassword, requestId);
    console.info(
      JSON.stringify({
        event: "auth.admin_password_reset",
        requestId,
        userId: administrator.id,
        databaseHost: databaseTarget.hostname,
        databaseName,
      }),
    );
    console.log("Contraseña restablecida. Comunícala directamente y de forma segura al administrador.");
  } catch (error: unknown) {
    console.error(
      JSON.stringify({
        event: "auth.admin_password_reset_failed",
        requestId,
        errorType: error instanceof Error ? error.name : "UnknownError",
      }),
    );
    throw new Error(`No se completó la recuperación. Referencia: ${requestId}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Falló la recuperación.");
  process.exitCode = 1;
});
