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
        x: -151.068436,
        y: 3277.098788,
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
        x: -72.97144,
        y: 3464.459273,
        width: 2200,
        height: 110,
        fontSize: 71,
        fontWeight: 700,
        color: "#b00000",
        textAlign: "center",
        maxLength: 80
      }
    ]
  },
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
        x: -345.653543,
        y: 2165.136933,
        width: 1800,
        height: 205.968296,
        fontSize: 100,
        fontWeight: 900,
        color: "#ffffff",
        textAlign: "center",
        maxLength: 42
      },
      {
        id: "message",
        label: "Promotion message",
        placeholder: "Best wishes for Himalayan Mela",
        x: 579.611789,
        y: 2606.772823,
        width: 2225.317721,
        height: 333.003986,
        fontSize: 100,
        fontWeight: 700,
        color: "#ffffff",
        textAlign: "center",
        lineHeight: 1.2,
        multiline: true,
        maxLength: 120
      }
    ]
  }
];
