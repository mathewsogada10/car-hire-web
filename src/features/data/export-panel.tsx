import { download } from "../../services/api";
import type { DataManagementState } from "./use-data-management";

export function ExportPanel({ state }: { state: DataManagementState }) {
  const { busy, run, setStatus } = state;
  return (
    <section className="panel">
      <h2>1. Verified export</h2>
      <p>
        Creates a full, attachment-excluded ZIP with manifest, CSV, typed JSONL
        and SHA-256 checksums. Attachment-bearing records remain protected from
        purge.
      </p>
      <button
        disabled={busy}
        onClick={() =>
          run(async () => {
            await download(
              "/exports",
              `car-hire-export_${new Date().toISOString().slice(0, 10)}.zip`,
              { method: "POST" },
            );
            setStatus("Verified export downloaded. Keep it in safe storage.");
          })
        }
      >
        Create & download export
      </button>
    </section>
  );
}
