import { describe, it, expect } from "vitest";
import { RULES_VERSION } from "./index.js";

describe("game-rules baseline smoke", () => {
  it("exports a valid rules version matching protocol", () => {
    expect(RULES_VERSION).toBe("1.0.0");
  });
});
