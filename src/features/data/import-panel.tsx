import { api } from "../../services/api";
import type { ImportPreview } from "./types";
import type { DataManagementState } from "./use-data-management";

export function ImportPanel({ state }: { state: DataManagementState }) {
  const {
    busy,
    run,
    file,
    setFile,
    importPreview,
    setImportPreview,
    setStatus,
  } = state;
  return (
    <section className="panel">
      <h2>2. Validate & import</h2>
      <input
        aria-label="Portable ZIP"
        type="file"
        accept=".zip"
        onChange={(e) => {
          setFile(e.target.files?.[0]);
          setImportPreview(undefined);
        }}
      />
      <div className="actions">
        <button
          disabled={busy || !file}
          onClick={() =>
            run(async () => {
              const body = new FormData();
              body.append("file", file!);
              const preview = await api<ImportPreview>("/imports", {
                method: "POST",
                body,
              });
              setImportPreview(preview);
            })
          }
        >
          Validate package
        </button>
        {importPreview && (
          <button
            disabled={busy || importPreview.conflicted.length > 0}
            onClick={() =>
              run(async () => {
                const body = new FormData();
                body.append("file", file!);
                const result = await api<ImportPreview>(
                  `/imports?commit=true&packageHash=${importPreview.packageHash}`,
                  { method: "POST", body },
                );
                setImportPreview(result);
                setStatus("Import committed and reconciled.");
              })
            }
          >
            Commit validated import
          </button>
        )}
      </div>
      {importPreview && <pre>{JSON.stringify(importPreview, null, 2)}</pre>}
    </section>
  );
}
