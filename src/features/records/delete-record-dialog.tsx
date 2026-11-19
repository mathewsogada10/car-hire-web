import type { Row } from "../../services/api";
import { label } from "./record-label";

export function DeleteRecordDialog({
  row,
  confirm,
  cancel,
}: {
  row: Row;
  confirm: () => Promise<void>;
  cancel: () => void;
}) {
  return (
    <div className="overlay">
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Confirm deletion"
        className="dialog"
      >
        <h2>Delete {label(row)}?</h2>
        <p>
          This creates a sync tombstone. Referenced and received financial
          entries are protected.
        </p>
        <div className="actions">
          <button className="danger" onClick={confirm}>
            Confirm delete
          </button>
          <button className="quiet" onClick={cancel}>
            Cancel
          </button>
        </div>
      </section>
    </div>
  );
}
