import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { ApiError, message, save, SETTINGS_ID } from "../../../services/api";
import type { Change, Data, Row } from "../../../services/api";
import { instantInput, parseInstant } from "../../../utilities/dates";
import { moneyInput } from "../../../utilities/money";
import { defaults } from "../defaults";
import { schemas } from "../schemas";
import { hireFieldValue, plannedFields } from "../hire-timing";

export function useRecordForm(
  kind: string,
  row: Row | undefined,
  saved: () => void,
) {
  const [id] = useState(
    row?.id ?? (kind === "settings" ? SETTINGS_ID : crypto.randomUUID()),
  );
  const [values, setValues] = useState<Record<string, string | boolean>>(() => {
    const result: Record<string, string | boolean> = {};
    const d = row?.data ?? defaults(kind);
    for (const f of schemas[kind].fields) {
      const v = d[f.key];
      result[f.key] =
        f.type === "boolean"
          ? Boolean(v)
          : v == null
            ? ""
            : f.type === "money"
              ? (Number(v) / 100).toFixed(2)
              : f.type === "instant"
                ? instantInput(String(v))
                : String(v);
    }
    return result;
  });
  const [error, setError] = useState("");
  const [detail, setDetail] = useState<unknown>();
  const [busy, setBusy] = useState(false);
  const operation = useRef<{ payload: string; id: string } | null>(null);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setDetail(undefined);
    try {
      const data: Data = { ...row?.data };
      for (const f of schemas[kind].fields) {
        const value =
          kind === "hires" ? hireFieldValue(values, f.key) : values[f.key];
        if (f.type === "boolean") {
          data[f.key] = Boolean(value);
          continue;
        }
        const text = String(value ?? "").trim();
        if (!text && f.optional) {
          delete data[f.key];
          continue;
        }
        if (f.type === "money") data[f.key] = moneyInput(text);
        else if (f.type === "number") {
          if (!/^\d+$/.test(text) || !Number.isSafeInteger(Number(text)))
            throw new Error(`${f.label} must be a nonnegative whole number.`);
          data[f.key] = Number(text);
        } else if (f.type === "instant")
          data[f.key] = parseInstant(
            text,
            String(row?.data[f.key] ?? row?.data[plannedFields[f.key]] ?? ""),
          );
        else data[f.key] = text;
      }
      if (
        kind === "settings" &&
        data.remindersEnabled &&
        (!data.reminderTime ||
          data.reminderLeadDays == null ||
          !data.backupReminderDays)
      )
        throw new Error(
          "Enabled reminders require a time, lead days, and positive backup interval.",
        );
      const payload = JSON.stringify(data);
      if (!operation.current || operation.current.payload !== payload)
        operation.current = { payload, id: crypto.randomUUID() };
      const change: Change = {
        operationId: operation.current.id,
        id,
        kind,
        baseRevision: row?.revision ?? 0,
        data,
        deleted: false,
      };
      await save(change);
      saved();
    } catch (e) {
      setError(message(e));
      if (e instanceof ApiError) setDetail(e.detail);
    } finally {
      setBusy(false);
    }
  }

  return { values, setValues, error, detail, busy, submit };
}
