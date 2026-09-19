import { describe, expect, it } from "vitest";

import { cn } from "@/lib/utils";

describe("repository bootstrap", () => {
  it("provides the shared class-name utility", () => {
    expect(cn("px-2", "px-4")).toContain("px-4");
  });
});
