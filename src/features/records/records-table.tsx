import { useId, useMemo } from "react";
import type { Row } from "../../services/api";
import { displayMoney } from "../../utilities/money";
import { instantInput } from "../../utilities/dates";
import { schemas } from "./schemas";
import { registration } from "./record-label";
import { hireDays } from "./hire-timing";
import type { Field } from "./types";

export function RecordsTable({
  kind,
  rows,
  references,
  onEdit,
  onDelete,
}: {
  kind: string;
  rows: Row[];
  references: Row[];
  onEdit: (row: Row) => void;
  onDelete: (row: Row) => void;
}) {
  const hintId = useId();
  const context = useMemo(
    () => new Map([...references, ...rows].map((row) => [row.id, row])),
    [references, rows],
  );
  const specialFields: Record<string, Field[]> = {
    hires: [
      { key: "registration", label: "Registration" },
      { key: "chargeMinor", label: "Amount", type: "money" },
      { key: "plannedStart", label: "Planned pickup", type: "instant" },
      { key: "plannedEnd", label: "Planned return", type: "instant" },
      { key: "days", label: "Days" },
    ],
    payments: [
      { key: "registration", label: "Registration" },
      { key: "amountMinor", label: "Amount", type: "money" },
      { key: "date", label: "Payment date", type: "date" },
    ],
  };
  const fields =
    specialFields[kind] ??
    schemas[kind].fields
      .filter(
        (f) =>
          ![
            "notes",
            "zeroChargeConfirmed",
            "actualStart",
            "actualEnd",
            "correctionReason",
          ].includes(f.key),
      )
      .slice(0, 6);
  if (kind === "expenses")
    fields.push({ key: "paidDate", label: "Paid date", type: "date" });

  return (
    <>
      <p className="table-hint" id={hintId}>
        Scroll horizontally to see all columns. Open and Delete stay visible.
      </p>
      <div
        className="table-wrap"
        role="region"
        aria-label={`${schemas[kind].title} records`}
        aria-describedby={hintId}
        tabIndex={0}
      >
        <table>
          <thead>
            <tr>
              {fields.map((f) => (
                <th key={f.key}>{f.label}</th>
              ))}
              <th className="record-actions-cell">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                {fields.map((f) => (
                  <td key={f.key}>
                    {f.key === "registration" && kind !== "vehicles" ? (
                      registration(row, context)
                    ) : f.key === "days" ? (
                      `Days:${hireDays(String(row.data.plannedStart), String(row.data.plannedEnd)) ?? "Not recorded"}`
                    ) : f.key === "paidDate" ? (
                      String(
                        row.data.paidDate || row.data.date || "Not recorded",
                      )
                    ) : f.type === "money" ? (
                      displayMoney(Number(row.data[f.key] ?? 0))
                    ) : f.type === "instant" ? (
                      instantInput(String(row.data[f.key] ?? "")).replace(
                        "T",
                        " ",
                      )
                    ) : f.key === "vehicleId" ? (
                      registration(row, context)
                    ) : f.reference ? (
                      <span
                        className="record-id"
                        title={String(row.data[f.key] ?? "")}
                      >
                        {String(row.data[f.key] ?? "").slice(0, 8)}
                      </span>
                    ) : (
                      String(row.data[f.key] ?? "-")
                    )}
                  </td>
                ))}
                <td className="record-actions-cell">
                  <div className="row-actions">
                    <button className="quiet" onClick={() => onEdit(row)}>
                      Open
                    </button>
                    <button
                      className="danger quiet"
                      onClick={() => onDelete(row)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
