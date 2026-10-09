import { describe, expect, it } from "vitest";
import { onePageFixture } from "@/features/quotes/documents/fixtures";
import { calculateQuoteTotals } from "@/features/quotes/domain/calculate-quote-totals";

describe("calculateQuoteTotals", () => {
  it("adds 18 percent to the base subtotal only in Con IGV mode", () => {
    const totals = calculateQuoteTotals(onePageFixture);

    expect(totals.subtotal).toBe("1000.00");
    expect(totals.taxRate).toBe("18.00");
    expect(totals.taxAmount).toBe("180.00");
    expect(totals.total).toBe("1180.00");
  });

  it("does not add tax in Sin IGV mode or compound it from a prior total", () => {
    const withoutTax = calculateQuoteTotals({
      ...onePageFixture,
      taxMode: "without-igv",
    });
    const switchedBack = calculateQuoteTotals({
      ...onePageFixture,
      taxMode: "with-igv",
    });

    expect(withoutTax.subtotal).toBe("1000.00");
    expect(withoutTax.taxRate).toBe("0.00");
    expect(withoutTax.taxAmount).toBe("0.00");
    expect(withoutTax.total).toBe("1000.00");
    expect(switchedBack.total).toBe("1180.00");
  });
});
