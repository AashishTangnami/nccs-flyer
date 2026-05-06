import { describe, expect, it } from "vitest";
import { flyerTemplates } from "./flyer-templates";

describe("flyerTemplates", () => {
  it("defines exactly four promotion templates from flyer backgrounds", () => {
    expect(flyerTemplates).toHaveLength(4);

    flyerTemplates.forEach((template) => {
      expect(template.width).toBe(3240);
      expect(template.height).toBe(4320);
      expect(template.backgroundImage).toMatch(/^\/flyers-backgrounds\//);
      expect(template.photoSlot.width).toBeGreaterThan(0);
      expect(template.photoSlot.height).toBeGreaterThan(0);
      expect(template.textFields.length).toBeGreaterThanOrEqual(2);
    });
  });

  it("uses the requested text origin and 135px vertical spacing", () => {
    flyerTemplates.forEach((template) => {
      template.textFields.forEach((field, index) => {
        expect(field.x).toBeCloseTo(453.821721);
        expect(field.y).toBeCloseTo(3051.64959 + index * 135);
      });
    });
  });
});
