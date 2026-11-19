import type { Row } from "../../services/api";
import { Notice } from "../../components/notice";
import { schemas } from "./schemas";
import { Attachments } from "./attachments";
import { RecordFields } from "./record-fields";
import { useRecordForm } from "./hooks/use-record-form";

export function RecordForm({
  kind,
  row,
  close,
  saved,
}: {
  kind: string;
  row?: Row;
  close: () => void;
  saved: () => void;
}) {
  const { values, setValues, error, detail, busy, submit } = useRecordForm(
    kind,
    row,
    saved,
  );
  const immutable = kind === "payments" && row?.data.status === "Received";
  return (
    <div className="editor">
      <div className="section-head">
        <h2>
          {row ? "Edit" : "New"} {schemas[kind].title.toLowerCase()}
        </h2>
        <button className="quiet" disabled={busy} onClick={close}>
          Close
        </button>
      </div>
      {immutable && (
        <p className="notice">
          Received entries cannot be edited. Add a refund or compensating entry
          instead.
        </p>
      )}
      <form onSubmit={submit}>
        <RecordFields kind={kind} values={values} setValues={setValues} />
        <Notice error={error} />
        {detail != null && (
          <details open>
            <summary>Conflict / validation evidence</summary>
            <pre>{JSON.stringify(detail, null, 2)}</pre>
            <p>
              Close this form and reopen the record to load the latest version.
              Financial conflicts require a deliberate new entry; nothing was
              overwritten.
            </p>
          </details>
        )}
        <div className="actions">
          <button disabled={busy || immutable}>
            {busy ? "Saving..." : "Save changes"}
          </button>
          <button
            type="button"
            className="quiet"
            disabled={busy}
            onClick={close}
          >
            Cancel
          </button>
        </div>
      </form>
      {row && kind !== "settings" && <Attachments row={row} />}
    </div>
  );
}
