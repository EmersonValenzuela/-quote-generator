"use server";

import { randomUUID } from "node:crypto";
import { isAPIError } from "better-auth/api";
import { headers } from "next/headers";
import { z } from "zod";
import { getAuth } from "@/lib/auth/auth";
import { getPrismaClient } from "@/lib/db/prisma";
import { logEvent } from "@/lib/logging/logger";

const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1).max(128),
    newPassword: z.string().min(12).max(128),
  })
  .refine((value) => value.currentPassword !== value.newPassword, {
    path: ["newPassword"],
    message: "La contraseña nueva debe ser distinta de la temporal.",
  });

export interface PasswordChangeResult {
  success: boolean;
  message: string;
}

export async function changeTemporaryPassword(
  input: unknown,
): Promise<PasswordChangeResult> {
  const requestId = randomUUID();
  const parsed = passwordChangeSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Revisa la contraseña ingresada.",
    };
  }

  const requestHeaders = await headers();
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session) {
    return { success: false, message: "Tu sesión venció. Inicia sesión nuevamente." };
  }
  if (!session.user.isActive) {
    return { success: false, message: "Esta cuenta está desactivada. Contacta al administrador." };
  }
  if (!session.user.mustChangePassword) {
    return {
      success: false,
      message: "No hay un cambio obligatorio pendiente en esta cuenta.",
    };
  }

  try {
    await auth.api.changePassword({
      body: {
        currentPassword: parsed.data.currentPassword,
        newPassword: parsed.data.newPassword,
        revokeOtherSessions: true,
      },
      headers: requestHeaders,
    });
  } catch (error: unknown) {
    if (isAPIError(error)) {
      logEvent("warn", "auth.temporary_password_change_rejected", {
        requestId,
        userId: session.user.id,
        status: error.status,
      });
      return {
        success: false,
        message: "No pudimos verificar la contraseña temporal. Revisa e inténtalo nuevamente.",
      };
    }

    logEvent("error", "auth.temporary_password_change_failed", {
      requestId,
      userId: session.user.id,
      errorType: error instanceof Error ? error.name : "UnknownError",
    });
    return {
      success: false,
      message: `No se pudo completar el cambio. Contacta al administrador con la referencia ${requestId}.`,
    };
  }

  try {
    await getPrismaClient().$transaction(async (transaction) => {
      await transaction.user.update({
        where: { id: session.user.id },
        data: { mustChangePassword: false },
      });
      await transaction.auditEvent.create({
        data: {
          actorId: session.user.id,
          action: "auth.temporary_password_changed",
          entityType: "user",
          entityId: session.user.id,
          requestId,
        },
      });
    });
  } catch (error: unknown) {
    logEvent("error", "auth.password_rotation_flag_update_failed", {
      requestId,
      userId: session.user.id,
      errorType: error instanceof Error ? error.name : "UnknownError",
    });
    return {
      success: false,
      message:
        "La contraseña pudo haberse actualizado, pero no se completó el acceso. Contacta al administrador antes de continuar.",
    };
  }

  const signOutResult = await auth.api.signOut({ headers: requestHeaders });
  if (!signOutResult.success) {
    logEvent("error", "auth.sign_out_after_password_change_failed", {
      requestId,
      userId: session.user.id,
    });
    return {
      success: false,
      message: "La contraseña se actualizó. Cierra sesión e ingresa nuevamente.",
    };
  }

  return {
    success: true,
    message: "Contraseña actualizada. Inicia sesión con tu nueva contraseña.",
  };
}
