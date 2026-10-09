import Decimal from "decimal.js";
import type { QuoteDocumentModel } from "./quote-document-model";

const MONEY_DECIMAL_PLACES = 2;

export interface QuoteTotals {
  lineAmounts: string[];
  subtotal: string;
  taxRate: string;
  taxAmount: string;
  total: string;
}

function roundMoney(amount: Decimal): Decimal {
  return amount.toDecimalPlaces(MONEY_DECIMAL_PLACES, Decimal.ROUND_HALF_UP);
}

export function calculateQuoteTotals(model: QuoteDocumentModel): QuoteTotals {
  const lineAmounts = model.items.map((item) =>
    roundMoney(new Decimal(item.quantity).mul(item.unitPrice)).toFixed(2),
  );
  const subtotal = roundMoney(
    lineAmounts.reduce((sum, amount) => sum.plus(amount), new Decimal(0)),
  );
  const taxRate =
    model.taxMode === "with-igv" ? new Decimal(model.appliedTaxRate) : new Decimal(0);
  const taxAmount = roundMoney(subtotal.mul(taxRate).div(100));
  const total = subtotal.plus(taxAmount);

  return {
    lineAmounts,
    subtotal: subtotal.toFixed(2),
    taxRate: taxRate.toFixed(2),
    taxAmount: taxAmount.toFixed(2),
    total: total.toFixed(2),
  };
}
