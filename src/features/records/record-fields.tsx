import type { Dispatch, SetStateAction } from "react";
import { Reference } from "./reference";
import { schemas } from "./schemas";

export function RecordFields({
  kind,
  values,
  setValues,
}: {
  kind: string;
  values: Record<string, string | boolean>;
  setValues: Dispatch<SetStateAction<Record<string, string | boolean>>>;
}) {
  return (
    <div className="form-grid">
      {schemas[kind].fields.map((f) => (
        <label key={f.key} className={f.type === "textarea" ? "wide" : ""}>
          <span>
            {f.label}
            {f.optional ? " (optional)" : ""}
          </span>
          {f.reference ? (
            <Reference
              kind={f.reference}
              required={!f.optional}
              value={String(values[f.key] ?? "")}
              onChange={(v) => setValues((prev) => ({ ...prev, [f.key]: v }))}
            />
          ) : f.options ? (
            <select
              aria-label={f.label}
              value={String(values[f.key] ?? "")}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, [f.key]: e.target.value }))
              }
            >
              {f.options.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          ) : f.type === "boolean" ? (
            <input
              type="checkbox"
              checked={Boolean(values[f.key])}
              onChange={(e) =>
                setValues((prev) => ({
                  ...prev,
                  [f.key]: e.target.checked,
                }))
              }
            />
          ) : f.type === "textarea" ? (
            <textarea
              maxLength={2000}
              required={!f.optional}
              value={String(values[f.key] ?? "")}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, [f.key]: e.target.value }))
              }
            />
          ) : (
            <input
              type={
                f.type === "instant"
                  ? "datetime-local"
                  : f.type === "money" || f.type === "number"
                    ? "text"
                    : (f.type ?? "text")
              }
              inputMode={
                f.type === "money"
                  ? "decimal"
                  : f.type === "number"
                    ? "numeric"
                    : undefined
              }
              required={!f.optional}
              maxLength={2000}
              value={String(values[f.key] ?? "")}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, [f.key]: e.target.value }))
              }
            />
          )}
        </label>
      ))}
    </div>
  );
}
