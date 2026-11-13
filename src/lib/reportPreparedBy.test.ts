import { describe, expect, it } from "vitest";
import { formatReportPreparedByName } from "@/lib/reportPreparedBy";

describe("formatReportPreparedByName", () => {
  it("prefers a real name over email", () => {
    expect(
      formatReportPreparedByName({
        email: "emin.konya@example.com",
        fullName: "Emin Konya",
      }),
    ).toBe("Emin Konya");
  });

  it("title-cases the email local part", () => {
    expect(
      formatReportPreparedByName({ email: "emin.konya@example.com" }),
    ).toBe("Emin Konya");
  });

  it("returns empty when nothing is given", () => {
    expect(formatReportPreparedByName({})).toBe("");
  });
});
