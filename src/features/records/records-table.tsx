import { useId } from "react";
import type { Row } from "../../services/api";
import { displayMoney } from "../../utilities/money";
import { instantInput } from "../../utilities/dates";
import { schemas } from "./schemas";

export function RecordsTable({
  kind,
  rows,
  calendar,
  onEdit,
  onDelete,
}: {
  kind: string;
  rows: Row[];
  calendar: boolean;
  onEdit: (row: Row) => void;
  onDelete: (row: Row) => void;
}) {
  const hintId = useId();
  const fields = schemas[kind].fields
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
  const ordered = calendar
    ? [...rows].sort((a, b) =>
        String(a.data.plannedStart).localeCompare(String(b.data.plannedStart)),
      )
    : rows;

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
            {ordered.map((row) => (
              <tr key={row.id}>
                {fields.map((f) => (
                  <td key={f.key}>
                    {f.type === "money" ? (
                      displayMoney(Number(row.data[f.key] ?? 0))
                    ) : f.type === "instant" ? (
                      instantInput(String(row.data[f.key] ?? "")).replace(
                        "T",
                        " ",
                      )
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
