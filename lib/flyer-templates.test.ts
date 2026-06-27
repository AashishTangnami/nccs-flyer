import { describe, expect, it } from "vitest";
import { flyerTemplates } from "./flyer-templates";

describe("flyerTemplates", () => {
  it("defines the available promotion templates from flyer backgrounds", () => {
    expect(flyerTemplates).toHaveLength(3);

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
    flyerTemplates
      .filter((template) => template.id === "right-photo-promotion")
      .forEach((template) => {
        template.textFields.forEach((field, index) => {
          expect(field.x).toBeCloseTo(453.821721);
          expect(field.y).toBeCloseTo(3051.64959 + index * 135);
        });
      });
  });

  it("uses the custom text defaults for flyer 2", () => {
    const template = flyerTemplates.find((item) => item.id === "bottom-photo-promotion");
    const promoterName = template?.textFields.find((field) => field.id === "promoterName");
    const message = template?.textFields.find((field) => field.id === "message");

    expect(template?.textFields.map((field) => field.id)).toEqual(["promoterName", "message"]);
    expect(promoterName).toMatchObject({
      x: -151.068436,
      y: 3277.098788,
      width: 2200,
      height: 130,
      color: "#0b4f93",
      fontSize: 92,
      fontWeight: 900,
      textAlign: "center"
    });
    expect(message).toMatchObject({
      x: -72.97144,
      y: 3464.459273,
      width: 2200,
      height: 110,
      color: "#b00000",
      fontSize: 71,
      fontWeight: 700,
      textAlign: "center"
    });
  });

  it("uses the custom white text layout for the blue template", () => {
    const blueTemplate = flyerTemplates.find((template) => template.id === "best-wishes-hm-blue");
    const promoterName = blueTemplate?.textFields.find((field) => field.id === "promoterName");
    const message = blueTemplate?.textFields.find((field) => field.id === "message");

    expect(promoterName).toMatchObject({
      x: -345.653543,
      y: 2165.136933,
      width: 1800,
      height: 205.968296,
      color: "#ffffff",
      fontSize: 100,
      fontWeight: 900,
      textAlign: "center"
    });
    expect(message).toMatchObject({
      x: 579.611789,
      y: 2606.772823,
      width: 2225.317721,
      height: 333.003986,
      color: "#ffffff",
      fontSize: 100,
      fontWeight: 700,
      lineHeight: 1.2,
      textAlign: "center"
    });
  });
});
