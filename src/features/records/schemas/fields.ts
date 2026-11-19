import type { Field } from "../types";

export const f = (
  key: string,
  label: string,
  type: Field["type"] = "text",
  optional = false,
): Field => ({ key, label, type, optional });
export const ref = (
  key: string,
  label: string,
  reference: string,
  optional = false,
): Field => ({ key, label, reference, optional });
export const options = (
  key: string,
  label: string,
  values: string[],
): Field => ({
  key,
  label,
  options: values,
});
export const vehicle = ref("vehicleId", "Vehicle", "vehicles");
export const date = f("date", "Business date", "date");
export const amount = f("amountMinor", "Amount (KES)", "money");
export const notes = f("notes", "Notes", "textarea", true);
export const name = f("name", "Name");
