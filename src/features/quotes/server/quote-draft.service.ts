import "server-only";

import { randomUUID } from "node:crypto";
import Decimal from "decimal.js";
import { z } from "zod";
import { calculateQuoteTotals } from "@/features/quotes/domain/calculate-quote-totals";
import type { QuoteDocumentModel } from "@/features/quotes/domain/quote-document-model";
import type {
  PersistedQuoteDraft,
  QuoteDraftSummary,
} from "@/features/quotes/domain/quote-draft-types";
import { getPrismaClient } from "@/lib/db/prisma";

const decimalQuantity = z
  .string()
  .regex(/^\d{1,7}(?:\.\d{1,3})?$/)
  .refine((value) => Number(value) > 0, "La cantidad debe ser mayor que cero.");
const decimalPrice = z.union([
  z.literal(""),
  z.string().regex(/^\d{1,8}(?:\.\d{1,4})?$/),
]);

const draftSchema = z.object({
  id: z.string().cuid().optional(),
  expectedVersion: z.number().int().positive().optional(),
  model: z.object({
    issueDate: z.iso.date(),
    taxMode: z.enum(["with-igv", "without-igv"]).nullable(),
    customer: z.object({
      id: z.string().cuid().nullable().optional(),
      name: z.string().trim().max(200),
      taxId: z.string().trim().max(30),
      address: z.string().trim().max(500),
      contact: z.string().trim().max(200),
    }),
    service: z.string().trim().max(500),
    items: z
      .array(
        z.object({
          description: z.string().trim().max(2000),
          quantity: decimalQuantity,
          unit: z.enum(["UND", "M", "M²", "KG", "SERV"]),
          unitPrice: decimalPrice,
        }),
      )
      .min(1)
      .max(100),
    materials: z.array(z.string().trim().max(2000)).max(100),
    conditions: z.object({
      payment: z.string().trim().max(5000),
      validity: z.string().trim().max(5000),
      execution: z.string().trim().max(5000),
    }),
  }),
});

export class QuoteDraftConflictError extends Error {
  constructor() {
    super("Este borrador cambió en otra sesión. Recarga la versión actual antes de guardar.");
    this.name = "QuoteDraftConflictError";
  }
}

export class QuoteDraftValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QuoteDraftValidationError";
  }
}

function toSummary(draft: {
  id: string;
  version: number;
  customerName: string;
  service: string;
  issueDate: Date;
  total: Decimal;
  taxMode: string | null;
}): QuoteDraftSummary {
  return {
    id: draft.id,
    version: draft.version,
    number: "Borrador",
    customer: draft.customerName || "Cliente pendiente",
    service: draft.service || "Servicio pendiente",
    issueDate: draft.issueDate.toISOString().slice(0, 10),
    total: draft.total.toFixed(2),
    status: "Borrador",
    taxMode: draft.taxMode === "with-igv" || draft.taxMode === "without-igv"
      ? draft.taxMode
      : null,
  };
}

export async function listQuoteDrafts(): Promise<QuoteDraftSummary[]> {
  const drafts = await getPrismaClient().quoteDraft.findMany({
    where: { status: "DRAFT" },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      version: true,
      customerName: true,
      service: true,
      issueDate: true,
      total: true,
      taxMode: true,
    },
  });

  return drafts.map(toSummary);
}

export async function getQuoteDraft(
  id: string,
): Promise<PersistedQuoteDraft | null> {
  const draft = await getPrismaClient().quoteDraft.findFirst({
    where: { id, status: "DRAFT" },
    include: { items: { orderBy: { position: "asc" } } },
  });
  if (!draft) return null;

  const model: QuoteDocumentModel = {
    documentPurpose: "draft",
    quoteNumber: `Borrador ${draft.id}`,
    revisionNumber: 1,
    issueDate: draft.issueDate.toISOString().slice(0, 10),
    taxMode:
      draft.taxMode === "with-igv" || draft.taxMode === "without-igv"
        ? draft.taxMode
        : null,
    appliedTaxRate: draft.appliedTaxRate.toString(),
    company: {
      name: draft.companyName,
      taxId: draft.companyTaxId,
      address: draft.companyAddress,
      phone: draft.companyPhone,
      bankDetails: draft.companyBankDetails,
    },
    customer: {
      id: draft.customerId,
      name: draft.customerName,
      taxId: draft.customerTaxId,
      address: draft.customerAddress,
      contact: draft.customerContact,
    },
    service: draft.service,
    items: draft.items.map((item) => ({
      id: item.id,
      description: item.description,
      quantity: item.quantity.toString(),
      unit: item.unitCode,
      unitPrice: item.unitPrice.toString(),
    })),
    materials: draft.materials,
    conditions: {
      payment: draft.paymentConditions,
      validity: draft.validityConditions,
      execution: draft.executionConditions,
    },
  };

  return { version: draft.version, model };
}

export async function saveQuoteDraft(
  input: unknown,
  userId: string,
  requestId = randomUUID(),
): Promise<{ summary: QuoteDraftSummary; version: number }> {
  const parsed = draftSchema.parse(input);
  if (parsed.id && parsed.expectedVersion === undefined) {
    throw new QuoteDraftConflictError();
  }

  const prisma = getPrismaClient();
  const company = await prisma.companySettings.findUnique({
    where: { id: "main" },
    include: { bankAccounts: true },
  });
  if (!company) {
    throw new Error("Falta la configuración inicial de la empresa. Ejecuta el seed bootstrap.");
  }

  const taxRate = parsed.model.taxMode === "with-igv" ? company.taxRate.toString() : "0";
  const modelForCalculation: QuoteDocumentModel = {
    ...parsed.model,
    items: parsed.model.items.map((item) => ({ ...item, id: randomUUID() })),
    quoteNumber: "Borrador",
    revisionNumber: 1,
    appliedTaxRate: taxRate,
    company: {
      name: company.legalName || company.tradeName,
      taxId: company.taxId,
      address: company.address,
      phone: company.phone,
      bankDetails: "",
    },
  };
  const totals = calculateQuoteTotals({
    ...modelForCalculation,
    items: modelForCalculation.items.map((item) => ({
      ...item,
      unitPrice: item.unitPrice || "0",
    })),
  });
  if (new Decimal(totals.total).greaterThan("999999999999.99")) {
    throw new QuoteDraftValidationError(
      "El total supera el máximo admitido para una cotización.",
    );
  }
  const data = {
    issueDate: new Date(`${parsed.model.issueDate}T00:00:00.000Z`),
    service: parsed.model.service,
    taxMode: parsed.model.taxMode,
    appliedTaxRate: new Decimal(taxRate),
    subtotal: new Decimal(totals.subtotal),
    taxAmount: new Decimal(totals.taxAmount),
    total: new Decimal(totals.total),
    customerId: parsed.model.customer.id || null,
    customerName: parsed.model.customer.name,
    customerTaxId: parsed.model.customer.taxId,
    customerAddress: parsed.model.customer.address,
    customerContact: parsed.model.customer.contact,
    companyName: modelForCalculation.company.name,
    companyTaxId: modelForCalculation.company.taxId,
    companyAddress: modelForCalculation.company.address,
    companyPhone: modelForCalculation.company.phone,
    companyBankDetails: company.bankAccounts
      .filter((account) => account.isActive)
      .sort((left, right) => left.position - right.position)
      .map((account) => `${account.bankName}: ${account.accountNumber}`)
      .join("\n"),
    materials: parsed.model.materials,
    paymentConditions: parsed.model.conditions.payment,
    validityConditions: parsed.model.conditions.validity,
    executionConditions: parsed.model.conditions.execution,
    updatedById: userId,
  };

  const saved = await prisma.$transaction(async (transaction) => {
    let id: string;
    let version: number;

    if (parsed.id) {
      id = parsed.id;
      const expectedVersion = parsed.expectedVersion;
      if (expectedVersion === undefined) throw new QuoteDraftConflictError();
      const update = await transaction.quoteDraft.updateMany({
        where: {
          id,
          status: "DRAFT",
          version: expectedVersion,
        },
        data: { ...data, version: { increment: 1 } },
      });
      if (update.count !== 1) throw new QuoteDraftConflictError();
      version = expectedVersion + 1;
      await transaction.quoteDraftItem.deleteMany({ where: { quoteDraftId: id } });
    } else {
      const created = await transaction.quoteDraft.create({
        data: { ...data, createdById: userId },
        select: { id: true },
      });
      id = created.id;
      version = 1;
    }

    await transaction.quoteDraftItem.createMany({
      data: parsed.model.items.map((item, position) => ({
        quoteDraftId: id,
        position,
        description: item.description,
        quantity: new Decimal(item.quantity),
        unitCode: item.unit,
        unitPrice: new Decimal(item.unitPrice || "0"),
      })),
    });
    await transaction.auditEvent.create({
      data: {
        actorId: userId,
        action: parsed.id ? "quote.draft_updated" : "quote.draft_created",
        entityType: "quote_draft",
        entityId: id,
        requestId,
      },
    });

    const summary = await transaction.quoteDraft.findUniqueOrThrow({
      where: { id },
      select: {
        id: true,
        version: true,
        customerName: true,
        service: true,
        issueDate: true,
        total: true,
        taxMode: true,
      },
    });
    return { summary: toSummary(summary), version };
  });

  return saved;
}
