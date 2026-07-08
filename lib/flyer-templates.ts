import type { FlyerTemplate } from "./types";

const flyerSize = {
  width: 3240,
  height: 4320
};

const textOrigin = {
  x: 453.821721,
  y: 3051.64959
};

export const flyerTemplates: FlyerTemplate[] = [
  {
    id: "best-wishes-hm-blue",
    name: "Best Wishes in Himalayan Mela",
    backgroundImage: "/flyers-backgrounds/best wishes hm blue2.png",
    ...flyerSize,
    photoSlot: {
      x: 430,
      y: 1480,
      width: 2380,
      height: 1760,
      borderRadius: 24
    },
    textFields: [
      {
        id: "promoterName",
        label: "Promoter name",
        placeholder: "Your Name",
        x: 720.02,
        y: 2583.25,
        width: 1800,
        height: 122.439,
        fontSize: 104.37,
        fontWeight: 900,
        color: "#ffffff",
        textAlign: "center",
        lineHeight: 1.15,
        maxLength: 42
      },
      {
        id: "role",
        label: "Role or subtitle",
        placeholder: "Official | Supporter | Ambassador",
        x: 669.059,
        y: 2700.13,
        width: 1800,
        height: 120,
        fontSize: 70,
        fontWeight: 700,
        color: "#ffeb3b",
        textAlign: "center",
        lineHeight: 1.15,
        maxLength: 54
      },
      {
        id: "message",
        label: "Promotion message",
        placeholder: "Best wishes for Himalayan Mela",
        x: 528.186,
        y: 2789.45,
        width: 2225.32,
        height: 162.097,
        fontSize: 74,
        fontWeight: 700,
        color: "#ffffff",
        textAlign: "center",
        lineHeight: 1.2,
        multiline: true,
        maxLength: 120
      }
    ]
  },
  {
    id: "right-photo-promotion",
    name: "Promote yourself in Himalayan Mela",
    backgroundImage: "/flyers-backgrounds/himalayan_flyer_promoter_placeholder.jpg",
    ...flyerSize,
    photoSlot: {
      x: 2140,
      y: 1380,
      width: 760,
      height: 1260,
      borderRadius: 24
    },
    textFields: [
      {
        id: "promoterName",
        label: "Promoter name",
        placeholder: "Your Name",
        x: 445.643,
        y: 2985.72,
        width: 1030,
        height: 150,
        fontSize: 96,
        fontWeight: 900,
        color: "#0f4f93",
        textAlign: "left",
        lineHeight: 1.05,
        maxLength: 42
      },
      {
        id: "role",
        label: "Role or subtitle",
        placeholder: "Official | Supporter ",
        x: 455.693,
        y: 3173.28,
        width: 1030,
        height: 100,
        fontSize: 58,
        fontWeight: 700,
        color: "#b00000",
        textAlign: "left",
        lineHeight: 1.15,
        maxLength: 54
      },
      {
        id: "message",
        label: "Promotion message",
        placeholder: "Join us for Himalayan Mela 2026",
        x: 459.264,
        y: 3323.67,
        width: 1120,
        height: 260,
        fontSize: 58,
        fontWeight: 700,
        color: "#0b3f78",
        textAlign: "left",
        lineHeight: 1.2,
        multiline: true,
        maxLength: 130
      }
    ]
  },
  {
    id: "bottom-photo-promotion",
    name: "Promote yourself in Himalayan Mela",
    backgroundImage: "/flyers-backgrounds/himalayan_flyer_bright_promoter_placeholder.jpg",
    ...flyerSize,
    photoSlot: {
      x: 1120,
      y: 2500,
      width: 1000,
      height: 1180,
      borderRadius: 24
    },
    textFields: [
      {
        id: "promoterName",
        label: "Promoter name",
        placeholder: "Your Name",
        x: 350.962,
        y: 3144.07,
        width: 1030,
        height: 150,
        fontSize: 96,
        fontWeight: 900,
        color: "#0b4f93",
        textAlign: "left",
        lineHeight: 1.05,
        maxLength: 42
      },
      {
        id: "role",
        label: "Role or subtitle",
        placeholder: "Official | Supporter ",
        x: 355.643,
        y: 3297.02,
        width: 1030,
        height: 100,
        fontSize: 58,
        fontWeight: 700,
        color: "#b00000",
        textAlign: "left",
        lineHeight: 1.15,
        maxLength: 54
      },
      {
        id: "message",
        label: "Promotion message",
        placeholder: "See you at Himalayan Mela",
        x: 358.426,
        y: 3437.57,
        width: 1120,
        height: 260,
        fontSize: 58,
        fontWeight: 700,
        color: "#0b3f78",
        textAlign: "left",
        lineHeight: 1.2,
        multiline: true,
        maxLength: 130
      }
    ]
  }
];
