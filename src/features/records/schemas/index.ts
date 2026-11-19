import type { Field } from "../types";
import { fleetSchemas } from "./fleet";
import { financeSchemas } from "./finance";
import { operationsSchemas } from "./operations";
import { settingsSchemas } from "./settings";

export const schemas: Record<string, { title: string; fields: Field[] }> = {
  ...fleetSchemas,
  ...financeSchemas,
  ...operationsSchemas,
  ...settingsSchemas,
};
