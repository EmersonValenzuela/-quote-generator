"use server";

import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import Decimal from "decimal.js";
import { ZodError, z } from "zod";
import { getAuth } from "@/lib/auth/auth";
import { getPrismaClient } from "@/lib/db/prisma";
import { logEvent } from "@/lib/logging/logger";

const customerSchema = z.object({
  name: z.string().trim().min(1, "Ingresa el nombre o razón social.").max(200),
  documentType: z.enum(["RUC", "DNI"]).nullable(),
  documentNumber: z.string().trim().max(30),
  address: z.string().trim().max(500),
  contactName: z.string().trim().max(200),
  email: z.union([z.literal(""), z.email()]).transform((value) => value.toLowerCase()),
  phone: z.string().trim().max(40),
});

async function getActiveUser() {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session || !session.user.isActive || session.user.mustChangePassword) {
    return null;
  }
  return session.user;
}

export async function createCustomer(input: unknown) {
  let userId: string | null = null;
  const requestId = randomUUID();
  try {
    const user = await getActiveUser();
    if (!user) return { success: false as const, message: "Tu sesión venció. Inicia sesión nuevamente." };
    userId = user.id;
    const parsed = customerSchema.parse(input);
    if (parsed.documentType && !parsed.documentNumber) {
      return { success: false as const, message: "Ingresa el número del documento seleccionado." };
    }
    const customer = await getPrismaClient().$transaction(async (transaction) => {
      if (parsed.documentNumber) {
        const existing = await transaction.customer.findFirst({
          where: { documentNumber: parsed.documentNumber },
          select: { id: true },
        });
        if (existing) throw new Error("Ya existe un cliente con ese número de documento.");
      }
      const created = await transaction.customer.create({
        data: {
          ...parsed,
          documentType: parsed.documentType,
          createdById: user.id,
        },
        include: { _count: { select: { quoteDrafts: true } } },
      });
      await transaction.auditEvent.create({
        data: {
          actorId: user.id,
          action: "customer.created",
          entityType: "customer",
          entityId: created.id,
          requestId,
        },
      });
      return created;
    });
    return {
      success: true as const,
      customer: {
        id: customer.id,
        name: customer.name,
        documentType: customer.documentType,
        documentNumber: customer.documentNumber,
        address: customer.address,
        contactName: customer.contactName,
        email: customer.email,
        phone: customer.phone,
        quoteCount: customer._count.quoteDrafts,
        isActive: customer.isActive,
      },
    };
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return { success: false as const, message: error.issues[0]?.message ?? "Revisa los datos del cliente." };
    }
    if (error instanceof Error && error.message.startsWith("Ya existe")) {
      return { success: false as const, message: error.message };
    }
    logEvent("error", "customer.create_failed", {
      requestId,
      userId,
      errorType: error instanceof Error ? error.name : "UnknownError",
    });
    return { success: false as const, message: `No se pudo guardar el cliente. Referencia: ${requestId}` };
  }
}

export async function updateCustomer(id: string, input: unknown) {
  let userId: string | null = null;
  const requestId = randomUUID();
  try {
    const user = await getActiveUser();
    if (!user) return { success: false as const, message: "Tu sesión venció. Inicia sesión nuevamente." };
    userId = user.id;
    const parsedId = z.string().cuid().parse(id);
    const parsed = customerSchema.parse(input);
    if (parsed.documentType && !parsed.documentNumber) {
      return { success: false as const, message: "Ingresa el número del documento seleccionado." };
    }
    const updated = await getPrismaClient().$transaction(async (transaction) => {
      if (parsed.documentNumber) {
        const existing = await transaction.customer.findFirst({
          where: { documentNumber: parsed.documentNumber, NOT: { id: parsedId } },
          select: { id: true },
        });
        if (existing) throw new Error("Ya existe otro cliente con ese número de documento.");
      }
      const customer = await transaction.customer.update({
        where: { id: parsedId },
        data: parsed,
        include: { _count: { select: { quoteDrafts: true } } },
      });
      await transaction.auditEvent.create({
        data: {
          actorId: user.id,
          action: "customer.updated",
          entityType: "customer",
          entityId: customer.id,
          requestId,
        },
      });
      return customer;
    });
    return {
      success: true as const,
      customer: {
        id: updated.id,
        name: updated.name,
        documentType: updated.documentType,
        documentNumber: updated.documentNumber,
        address: updated.address,
        contactName: updated.contactName,
        email: updated.email,
        phone: updated.phone,
        quoteCount: updated._count.quoteDrafts,
        isActive: updated.isActive,
      },
    };
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return { success: false as const, message: error.issues[0]?.message ?? "Revisa los datos del cliente." };
    }
    if (error instanceof Error && error.message.startsWith("Ya existe")) {
      return { success: false as const, message: error.message };
    }
    logEvent("error", "customer.update_failed", {
      requestId,
      userId,
      errorType: error instanceof Error ? error.name : "UnknownError",
    });
    return { success: false as const, message: `No se pudo actualizar el cliente. Referencia: ${requestId}` };
  }
}

export async function setCustomerActive(id: string, isActive: boolean) {
  let userId: string | null = null;
  const requestId = randomUUID();
  try {
    const user = await getActiveUser();
    if (!user) return { success: false as const, message: "Tu sesión venció. Inicia sesión nuevamente." };
    userId = user.id;
    const parsedId = z.string().cuid().parse(id);
    const result = await getPrismaClient().$transaction(async (transaction) => {
      const updated = await transaction.customer.update({
        where: { id: parsedId },
        data: { isActive },
        select: { id: true, isActive: true },
      });
      await transaction.auditEvent.create({
        data: {
          actorId: user.id,
          action: isActive ? "customer.activated" : "customer.deactivated",
          entityType: "customer",
          entityId: updated.id,
          requestId,
        },
      });
      return updated;
    });
    return { success: true as const, customer: result };
  } catch (error: unknown) {
    if (error instanceof ZodError) return { success: false as const, message: "El cliente seleccionado no es válido." };
    logEvent("error", "customer.status_update_failed", {
      requestId,
      userId,
      errorType: error instanceof Error ? error.name : "UnknownError",
    });
    return { success: false as const, message: `No se pudo actualizar el cliente. Referencia: ${requestId}` };
  }
}

const companySettingsSchema = z.object({
  tradeName: z.string().trim().min(1, "Ingresa el nombre comercial.").max(200),
  legalName: z.string().trim().max(200),
  taxId: z.string().trim().max(30),
  address: z.string().trim().max(500),
  phone: z.string().trim().max(40),
  email: z.union([z.literal(""), z.email()]).transform((value) => value.toLowerCase()),
  taxRate: z.string().regex(/^(?:100(?:\.00?)?|(?:\d{1,2})(?:\.\d{1,2})?)$/, "La tasa debe estar entre 0 y 100."),
  defaultValidityDays: z.number().int().min(1).max(365),
});

export async function saveCompanySettings(input: unknown) {
  let userId: string | null = null;
  const requestId = randomUUID();
  try {
    const user = await getActiveUser();
    if (!user) return { success: false as const, message: "Tu sesión venció. Inicia sesión nuevamente." };
    userId = user.id;
    if (user.role !== "admin") {
      return { success: false as const, message: "Solo el administrador puede cambiar la configuración de empresa." };
    }
    const parsed = companySettingsSchema.parse(input);
    await getPrismaClient().$transaction(async (transaction) => {
      await transaction.companySettings.update({
        where: { id: "main" },
        data: {
          ...parsed,
          taxRate: new Decimal(parsed.taxRate),
          setupCompleted: Boolean(parsed.legalName && parsed.taxId && parsed.address),
        },
      });
      await transaction.auditEvent.create({
        data: {
          actorId: user.id,
          action: "company.settings_updated",
          entityType: "company_settings",
          entityId: "main",
          requestId,
        },
      });
    });
    return { success: true as const, message: "Configuración guardada correctamente." };
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return { success: false as const, message: error.issues[0]?.message ?? "Revisa la configuración." };
    }
    logEvent("error", "company.settings_update_failed", {
      requestId,
      userId,
      errorType: error instanceof Error ? error.name : "UnknownError",
    });
    return { success: false as const, message: `No se pudo guardar la configuración. Referencia: ${requestId}` };
  }
}
