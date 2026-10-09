import { describe, expect, it } from "vitest";
import { createDraft } from "@/features/quotes/components/workspace-formatters";
import { DEFAULT_QUOTE_CONDITIONS } from "@/features/quotes/domain/default-quote-conditions";

describe("new quote defaults", () => {
  it("starts with editable commercial conditions and no specifications", () => {
    const draft = createDraft({
      name: "Empresa de prueba",
      taxId: "00000000000",
      address: "Dirección sintética",
      phone: "000000000",
      taxRate: "18",
      bankDetails: "",
    });

    expect(draft.conditions).toEqual({
      payment: "50 % de anticipo al confirmar la orden y 50 % contra entrega.",
      validity: "7 días calendario a partir de la fecha de emisión.",
      execution:
        "7 días calendario posteriores al pago de anticipo y recepción de la orden de trabajo.",
    });
    expect(draft.conditions).toEqual(DEFAULT_QUOTE_CONDITIONS);
    expect(draft.materials).toEqual([]);
  });
});
