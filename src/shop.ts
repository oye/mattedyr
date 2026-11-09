/** Cosmetic items the pet can wear. Bought with coins earned from correct answers. */

export type ItemSlot = "head" | "face" | "neck";

export interface Item {
  key: string;
  name: string;
  slot: ItemSlot;
  price: number;
}

export const ITEMS: Item[] = [
  { key: "sloyfe", name: "Sløyfe", slot: "neck", price: 15 },
  { key: "skjerf", name: "Skjerf", slot: "neck", price: 30 },
  { key: "briller", name: "Briller", slot: "face", price: 25 },
  { key: "solbriller", name: "Solbriller", slot: "face", price: 45 },
  { key: "lue", name: "Lue", slot: "head", price: 35 },
  { key: "caps", name: "Caps", slot: "head", price: 50 },
  { key: "tryllehatt", name: "Tryllehatt", slot: "head", price: 80 },
  { key: "krone", name: "Krone", slot: "head", price: 150 },
];

export const ITEMS_BY_KEY: Record<string, Item> = Object.fromEntries(ITEMS.map((i) => [i.key, i]));

export const SLOT_LABELS: Record<ItemSlot, string> = { head: "Hode", face: "Ansikt", neck: "Hals" };

