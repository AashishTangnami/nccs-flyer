export type TextAlign = "left" | "center" | "right";

export type FlyerTextField = {
  id: string;
  label: string;
  placeholder: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontWeight?: string | number;
  color: string;
  textAlign?: TextAlign;
  lineHeight?: number;
  defaultValue?: string;
  multiline?: boolean;
  maxLength?: number;
};

export type PhotoSlot = {
  x: number;
  y: number;
  width: number;
  height: number;
  borderRadius?: number;
};

export type FlyerTemplate = {
  id: string;
  name: string;
  backgroundImage: string;
  width: number;
  height: number;
  photoSlot: PhotoSlot;
  textFields: FlyerTextField[];
};

export type ProcessingStatus =
  | "idle"
  | "preparing"
  | "removing"
  | "composing"
  | "done"
  | "error";
