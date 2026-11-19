import { schemas } from "../features/records/schemas";

export const navigationGroups = [
  {
    title: "Overview",
    items: [
      ["dashboard", "Overview"],
      ["calendar", "Calendar"],
      ["reports", "Reports"],
    ],
  },
  {
    title: "Business",
    items: Object.entries(schemas)
      .filter(([key]) => key !== "settings")
      .map(([key, schema]) => [key, schema.title]),
  },
  {
    title: "Tools & settings",
    items: [
      ["data", "Data & imports"],
      ["sync", "Sync & devices"],
      ["audit", "Audit"],
      ["settings", "Settings"],
    ],
  },
];

export function navigationTitle(view: string) {
  return (
    navigationGroups
      .flatMap((group) => group.items)
      .find(([key]) => key === view)?.[1] ?? "Workspace"
  );
}
