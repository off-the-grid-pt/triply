import { describe, expect, it } from "vitest";
import { deriveTripLifecycle, sortActiveTrips } from "@/features/trips/lifecycle";
import { parseMoneyToMinorUnits } from "@/features/trips/money";
import { deleteTripConfirmationSchema, targetBudgetMinor, tripFormSchema } from "@/features/trips/schemas";
import type { Trip } from "@/features/trips/types";

const validInput = {
  name: " Mochilão Europa 2026 ",
  startDate: "2026-11-10",
  endDate: "2026-11-25",
  originLabel: " Lisboa ",
  returnLabel: "",
  travelersCount: "1",
  baseCurrency: "EUR",
  targetBudget: "3000.00",
  createRequestId: "8cbbb5e9-2f75-44ce-b327-94f289514303",
};

function trip(overrides: Partial<Trip> = {}): Trip {
  return {
    id: "46e9e0d3-c471-4159-845b-4ff248693cd3",
    userId: "9f417d19-57a9-49b4-b5e4-bc13d5f53f84",
    name: "Viagem",
    startDate: "2026-11-10",
    endDate: "2026-11-25",
    originLabel: null,
    returnLabel: null,
    travelersCount: 1,
    baseCurrency: "EUR",
    targetBudgetMinor: null,
    archivedAt: null,
    createdAt: "2026-09-01T00:00:00Z",
    updatedAt: "2026-09-01T00:00:00Z",
    ...overrides,
  };
}

describe("trip input validation", () => {
  it("accepts and normalizes a valid trip creation payload", () => {
    const result = tripFormSchema.parse(validInput);
    expect(result.name).toBe("Mochilão Europa 2026");
    expect(result.originLabel).toBe("Lisboa");
    expect(result.returnLabel).toBeNull();
    expect(targetBudgetMinor(result.targetBudget, result.baseCurrency)).toBe("300000");
  });

  it("rejects an end date before the start date", () => {
    expect(tripFormSchema.safeParse({ ...validInput, endDate: "2026-11-09" }).success).toBe(false);
  });

  it("rejects travelers_count below one and non-integers", () => {
    expect(tripFormSchema.safeParse({ ...validInput, travelersCount: "0" }).success).toBe(false);
    expect(tripFormSchema.safeParse({ ...validInput, travelersCount: "1.5" }).success).toBe(false);
  });

  it("rejects a negative budget", () => {
    expect(tripFormSchema.safeParse({ ...validInput, targetBudget: "-1" }).success).toBe(false);
  });

  it("keeps an omitted budget null", () => {
    const result = tripFormSchema.parse({ ...validInput, targetBudget: "" });
    expect(targetBudgetMinor(result.targetBudget, result.baseCurrency)).toBeNull();
  });

  it("keeps an explicit zero budget distinct from null", () => {
    const result = tripFormSchema.parse({ ...validInput, targetBudget: "0" });
    expect(targetBudgetMinor(result.targetBudget, result.baseCurrency)).toBe("0");
  });

  it("allows a same-day trip", () => {
    expect(tripFormSchema.safeParse({ ...validInput, endDate: validInput.startDate }).success).toBe(true);
  });

  it("rejects unsupported or malformed currency codes", () => {
    expect(tripFormSchema.safeParse({ ...validInput, baseCurrency: "eur" }).success).toBe(false);
    expect(tripFormSchema.safeParse({ ...validInput, baseCurrency: "AAA" }).success).toBe(false);
  });

  it("uses currency minor-unit metadata without floating-point arithmetic", () => {
    expect(parseMoneyToMinorUnits("12.34", "EUR")).toBe(1234n);
    expect(parseMoneyToMinorUnits("12.34", "JPY")).toBeNull();
  });
});

describe("trip lifecycle", () => {
  it("derives upcoming, ongoing and past without mutating the trip", () => {
    const value = trip();
    expect(deriveTripLifecycle(value, "2026-11-09")).toBe("upcoming");
    expect(deriveTripLifecycle(value, "2026-11-10")).toBe("ongoing");
    expect(deriveTripLifecycle(value, "2026-11-25")).toBe("ongoing");
    expect(deriveTripLifecycle(value, "2026-11-26")).toBe("past");
    expect(value.archivedAt).toBeNull();
  });

  it("archive overrides dates and restore returns to the derived state", () => {
    const archived = trip({ archivedAt: "2026-12-01T10:00:00Z" });
    expect(deriveTripLifecycle(archived, "2026-11-15")).toBe("archived");
    expect(deriveTripLifecycle({ ...archived, archivedAt: null }, "2026-11-15")).toBe("ongoing");
  });

  it("orders ongoing, nearest upcoming and most recent past trips", () => {
    const sorted = sortActiveTrips([
      trip({ id: "past-old", startDate: "2025-01-01", endDate: "2025-01-02" }),
      trip({ id: "future-late", startDate: "2027-03-01", endDate: "2027-03-02" }),
      trip({ id: "ongoing", startDate: "2026-08-01", endDate: "2026-09-10" }),
      trip({ id: "past-new", startDate: "2026-07-01", endDate: "2026-07-10" }),
      trip({ id: "future-near", startDate: "2026-10-01", endDate: "2026-10-02" }),
    ], "2026-09-01");
    expect(sorted.map((value) => value.id)).toEqual(["ongoing", "future-near", "future-late", "past-new", "past-old"]);
  });
});

describe("permanent deletion confirmation", () => {
  it("requires the exact trip name", () => {
    expect(deleteTripConfirmationSchema.safeParse({ confirmation: "Japão", expectedName: "Japão" }).success).toBe(true);
    expect(deleteTripConfirmationSchema.safeParse({ confirmation: "japão", expectedName: "Japão" }).success).toBe(false);
    expect(deleteTripConfirmationSchema.safeParse({ confirmation: "", expectedName: "Japão" }).success).toBe(false);
  });
});
