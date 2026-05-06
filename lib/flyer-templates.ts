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
        x: textOrigin.x,
        y: textOrigin.y,
        width: 1030,
        height: 150,
        fontSize: 96,
        fontWeight: 900,
        color: "#0f4f93",
        lineHeight: 1.05,
        maxLength: 42
      },
      {
        id: "role",
        label: "Role or subtitle",
        placeholder: "Official Promoter",
        x: textOrigin.x,
        y: textOrigin.y + 135,
        width: 1030,
        height: 100,
        fontSize: 58,
        fontWeight: 700,
        color: "#b00000",
        maxLength: 54
      },
      {
        id: "message",
        label: "Promotion message",
        placeholder: "Join us for Himalayan Mela 2026",
        x: textOrigin.x,
        y: textOrigin.y + 270,
        width: 1120,
        height: 260,
        fontSize: 58,
        fontWeight: 700,
        color: "#0b3f78",
        lineHeight: 1.2,
        multiline: true,
        maxLength: 130
      }
    ]
  },
  {
    id: "bright-top-promotion",
    name: "Share it with your Friends",
    backgroundImage: "/flyers-backgrounds/himalayan_flyer_1.jpg",
    ...flyerSize,
    photoSlot: {
      x: 285,
      y: 360,
      width: 720,
      height: 900,
      borderRadius: 24
    },
    textFields: [
      {
        id: "promoterName",
        label: "Promoter name",
        placeholder: "Your Name",
        x: textOrigin.x,
        y: textOrigin.y,
        width: 850,
        height: 120,
        fontSize: 78,
        fontWeight: 900,
        color: "#0b4f93",
        textAlign: "center",
        maxLength: 42
      },
      {
        id: "message",
        label: "Promotion message",
        placeholder: "Proudly promoting Himalayan Mela",
        x: textOrigin.x,
        y: textOrigin.y + 135,
        width: 1200,
        height: 170,
        fontSize: 50,
        fontWeight: 800,
        color: "#b00000",
        textAlign: "center",
        lineHeight: 1.2,
        multiline: true,
        maxLength: 110
      }
    ]
  },
  {
    id: "red-side-promotion",
    name: "Share it with your Friends",
    backgroundImage: "/flyers-backgrounds/himalayan_flyer_2.jpg",
    ...flyerSize,
    photoSlot: {
      x: 2250,
      y: 360,
      width: 720,
      height: 940,
      borderRadius: 24
    },
    textFields: [
      {
        id: "promoterName",
        label: "Promoter name",
        placeholder: "Your Name",
        x: textOrigin.x,
        y: textOrigin.y,
        width: 1020,
        height: 130,
        fontSize: 82,
        fontWeight: 900,
        color: "#0b4f93",
        textAlign: "center",
        maxLength: 42
      },
      {
        id: "role",
        label: "Role or subtitle",
        placeholder: "Community Promoter",
        x: textOrigin.x,
        y: textOrigin.y + 135,
        width: 960,
        height: 90,
        fontSize: 50,
        fontWeight: 800,
        color: "#b00000",
        textAlign: "center",
        maxLength: 58
      },
      {
        id: "message",
        label: "Promotion message",
        placeholder: "Celebrate Nepalese heritage with us",
        x: textOrigin.x,
        y: textOrigin.y + 270,
        width: 1040,
        height: 180,
        fontSize: 48,
        fontWeight: 700,
        color: "#0b3f78",
        textAlign: "center",
        lineHeight: 1.2,
        multiline: true,
        maxLength: 120
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
        x: textOrigin.x,
        y: textOrigin.y,
        width: 2200,
        height: 130,
        fontSize: 92,
        fontWeight: 900,
        color: "#0b4f93",
        textAlign: "center",
        maxLength: 48
      },
      {
        id: "message",
        label: "Promotion message",
        placeholder: "See you at Himalayan Mela",
        x: textOrigin.x,
        y: textOrigin.y + 135,
        width: 2200,
        height: 110,
        fontSize: 56,
        fontWeight: 700,
        color: "#b00000",
        textAlign: "center",
        maxLength: 80
      },
      {
        id: "cta",
        label: "Call to action",
        placeholder: "August 8, 2026",
        x: textOrigin.x,
        y: textOrigin.y + 270,
        width: 1720,
        height: 90,
        fontSize: 54,
        fontWeight: 800,
        color: "#0b4f93",
        textAlign: "center",
        maxLength: 54
      }
    ]
  }
];
