export interface Field {
  key: string;
  label: string;
  type?:
    | "text"
    | "date"
    | "instant"
    | "money"
    | "number"
    | "boolean"
    | "textarea"
    | "email"
    | "time";
  options?: string[];
  reference?: string;
  optional?: boolean;
}
