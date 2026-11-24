import type { Dispatch, SetStateAction } from "react";
import type { Data } from "../../services/api";
import { Reference } from "./reference";
import { schemas } from "./schemas";
import { draftHireDays, hireFieldValue } from "./hire-timing";

export function RecordFields({
  kind,
  values,
  setValues,
  original,
}: {
  kind: string;
  values: Record<string, string | boolean>;
  setValues: Dispatch<SetStateAction<Record<string, string | boolean>>>;
  original?: Data;
}) {
  return (
    <div className="form-grid">
      {schemas[kind].fields.map((f) => {
        const value =
          kind === "hires"
            ? hireFieldValue(values, f.key)
            : (values[f.key] ?? "");
        const change = (next: string | boolean) =>
          setValues((previous) => ({ ...previous, [f.key]: next }));
        return (
          <label key={f.key} className={f.type === "textarea" ? "wide" : ""}>
            <span>
              {f.label}
              {f.optional ? " (optional)" : ""}
            </span>
            {f.reference ? (
              <Reference
                kind={f.reference}
                required={!f.optional}
                value={String(value)}
                onChange={change}
              />
            ) : f.options ? (
              <select
                aria-label={f.label}
                value={String(value)}
                onChange={(e) => change(e.target.value)}
              >
                {f.options.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            ) : f.type === "boolean" ? (
              <input
                type="checkbox"
                checked={Boolean(value)}
                onChange={(e) => change(e.target.checked)}
              />
            ) : f.type === "textarea" ? (
              <textarea
                maxLength={2000}
                required={!f.optional}
                value={String(value)}
                onChange={(e) => change(e.target.value)}
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
                step={f.type === "instant" ? "0.001" : undefined}
                required={!f.optional}
                maxLength={2000}
                value={String(value)}
                onChange={(e) => change(e.target.value)}
              />
            )}
          </label>
        );
      })}
      {kind === "hires" && (
        <label>
          Number of days
          <input
            aria-label="Number of days"
            readOnly
            value={draftHireDays(values, original) ?? ""}
          />
          <span>
            Planned duration; partial 24-hour days round up. Enter a valid
            pickup and return.
          </span>
        </label>
      )}
    </div>
  );
}
