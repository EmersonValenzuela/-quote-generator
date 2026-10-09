import "server-only";
import { admin } from "better-auth/plugins";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { env } from "@/lib/env";
import { getPrismaClient } from "@/lib/db/prisma";

function createAuth() {
  return betterAuth({
    appName: "Cotizador",
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    database: prismaAdapter(getPrismaClient(), { provider: "postgresql" }),
    emailAndPassword: {
      enabled: true,
      disableSignUp: true,
      requireEmailVerification: false,
      minPasswordLength: 12,
      maxPasswordLength: 128,
    },
    user: {
      additionalFields: {
        mustChangePassword: {
          type: "boolean",
          defaultValue: false,
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
    databaseHooks: {
      session: {
        create: {
          before: async (session) => {
            const user = await getPrismaClient().user.findUnique({
              where: { id: session.userId },
              select: { isActive: true },
            });
            if (!user?.isActive) return false;
          },
        },
      },
    },
    plugins: [
      admin({
        defaultRole: "cotizador",
        adminRoles: ["admin"],
      }),
      nextCookies(),
    ],
    advanced: {
      database: { generateId: "uuid" },
    },
  });
}

let authInstance: ReturnType<typeof createAuth> | undefined;

export function getAuth() {
  authInstance ??= createAuth();
  return authInstance;
}
