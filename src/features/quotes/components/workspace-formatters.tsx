import { calculateQuoteTotals } from "@/features/quotes/domain/calculate-quote-totals";
import type { QuoteDraftSummary } from "@/features/quotes/domain/quote-draft-types";
import type { QuoteDocumentItem, QuoteDocumentModel } from "@/features/quotes/domain/quote-document-model";
import { DEFAULT_QUOTE_CONDITIONS } from "@/features/quotes/domain/default-quote-conditions";
import type { QuoteRow, QuoteStatus, CompanySnapshot } from "./workspace-types";

const currency = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
});
const dateFormatter = new Intl.DateTimeFormat("es-PE", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export function formatMoney(amount: number | string): string {
  return currency.format(Number(amount));
}

export function formatDate(value: string): string {
  return dateFormatter.format(new Date(`${value}T12:00:00Z`));
}

export function createEmptyItem(): QuoteDocumentItem {
  return {
    id: crypto.randomUUID(),
    description: "",
    quantity: "1",
    unit: "UND",
    unitPrice: "",
  };
}

export function createDraft(companySnapshot: CompanySnapshot): QuoteDocumentModel {
  return {
    quoteNumber: "Borrador de esta sesión",
    revisionNumber: 1,
    issueDate: new Date().toISOString().slice(0, 10),
    taxMode: null,
    appliedTaxRate: companySnapshot.taxRate,
    company: {
      ...companySnapshot,
    },
    customer: { id: null, name: "", taxId: "", address: "", contact: "" },
    service: "",
    items: [createEmptyItem()],
    materials: [],
    conditions: { ...DEFAULT_QUOTE_CONDITIONS },
  };
}

export function getTotals(model: QuoteDocumentModel) {
  const isValid = model.items.every((item) => {
    const quantity = /^\d{1,7}(?:\.\d{1,3})?$/.test(item.quantity);
    const price = item.unitPrice === "" || /^\d{1,8}(?:\.\d{1,4})?$/.test(item.unitPrice);
    return quantity && Number(item.quantity) > 0 && price;
  });

  return isValid
    ? calculateQuoteTotals({
        ...model,
        items: model.items.map((item) => ({
          ...item,
          unitPrice: item.unitPrice || "0",
        })),
      })
    : null;
}

export function StatusBadge({ status }: { status: QuoteStatus }) {
  const className = status.toLowerCase().replace(" ", "-");
  return <span className={`status-badge status-${className}`}>{status}</span>;
}

export function toQuoteRow(draft: QuoteDraftSummary): QuoteRow {
  return {
    ...draft,
    status: "Borrador",
  };
}
