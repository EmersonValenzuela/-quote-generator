"use server";

import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { ZodError } from "zod";
import {
  getQuoteDraft,
  listQuoteDrafts,
  QuoteDraftConflictError,
  QuoteDraftValidationError,
  saveQuoteDraft,
} from "@/features/quotes/server/quote-draft.service";
import { getAuth } from "@/lib/auth/auth";
import { logEvent } from "@/lib/logging/logger";

export type QuoteDraftSaveResult =
  | {
      success: true;
      summary: Awaited<ReturnType<typeof saveQuoteDraft>>["summary"];
      version: number;
      message: string;
    }
  | { success: false; conflict?: boolean; message: string };

async function getActiveUser() {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (
    !session ||
    !session.user.isActive ||
    session.user.mustChangePassword
  ) {
    return null;
  }
  return session.user;
}

export async function listPersistedQuoteDrafts() {
  const requestId = randomUUID();
  let userId: string | null = null;

  try {
    const user = await getActiveUser();
    if (!user) {
      return { success: false as const, message: "Tu sesión venció. Inicia sesión nuevamente." };
    }
    userId = user.id;
    const drafts = await listQuoteDrafts();
    return { success: true as const, drafts };
  } catch (error: unknown) {
    logEvent("error", "quote.draft_list_failed", {
      requestId,
      userId,
      errorType: error instanceof Error ? error.name : "UnknownError",
    });
    return {
      success: false as const,
      message: `No pudimos cargar las cotizaciones. Referencia: ${requestId}`,
    };
  }
}

export async function loadPersistedQuoteDraft(id: string) {
  const requestId = randomUUID();
  let userId: string | null = null;

  try {
    const user = await getActiveUser();
    if (!user) {
      return { success: false as const, message: "Tu sesión venció. Inicia sesión nuevamente." };
    }
    userId = user.id;
    const draft = await getQuoteDraft(id);
    return draft
      ? { success: true as const, draft }
      : { success: false as const, message: "No encontramos ese borrador." };
  } catch (error: unknown) {
    logEvent("error", "quote.draft_load_failed", {
      requestId,
      userId,
      errorType: error instanceof Error ? error.name : "UnknownError",
    });
    return {
      success: false as const,
      message: `No pudimos abrir el borrador. Referencia: ${requestId}`,
    };
  }
}

export async function savePersistedQuoteDraft(
  input: unknown,
): Promise<QuoteDraftSaveResult> {
  const requestId = randomUUID();
  let userId: string | null = null;
  try {
    const user = await getActiveUser();
    if (!user) {
      return { success: false, message: "Tu sesión venció. Inicia sesión nuevamente." };
    }
    userId = user.id;
    const result = await saveQuoteDraft(input, user.id, requestId);
    return {
      success: true,
      summary: result.summary,
      version: result.version,
      message: "Borrador guardado. Ya puedes volver a él desde cualquier sesión.",
    };
  } catch (error: unknown) {
    if (error instanceof QuoteDraftConflictError) {
      return { success: false, conflict: true, message: error.message };
    }
    if (error instanceof ZodError) {
      return {
        success: false,
        message: error.issues[0]?.message ?? "Revisa los datos de la cotización.",
      };
    }
    if (error instanceof QuoteDraftValidationError) {
      return { success: false, message: error.message };
    }
    logEvent("error", "quote.draft_save_failed", {
      requestId,
      userId,
      errorType: error instanceof Error ? error.name : "UnknownError",
    });
    return {
      success: false,
      message: `No se pudo guardar el borrador. Referencia: ${requestId}`,
    };
  }
}
