import { post, request } from "../../services/api";
import type { PurgePreview } from "./types";
import type { DataManagementState } from "./use-data-management";

export function PurgePanel({ state }: { state: DataManagementState }) {
  const {
    busy,
    run,
    batches,
    selected,
    setSelected,
    through,
    setThrough,
    password,
    setPassword,
    confirmation,
    setConfirmation,
    purgePreview,
    setPurgePreview,
    reauth,
    setStatus,
  } = state;
  return (
    <section className="panel">
      <h2>3. Safe acknowledgement & controlled purge</h2>
      <label>
        Export evidence
        <select
          value={selected}
          onChange={(e) => {
            setSelected(e.target.value);
            setPurgePreview(undefined);
          }}
        >
          <option value="">Select an export</option>
          {batches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.id} | {b.state}
            </option>
          ))}
        </select>
      </label>
      <label>
        Owner password (required for acknowledgement or purge)
        <input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>
      <label>
        Deliberate confirmation
        <input
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
          placeholder="I VERIFIED AND SAFELY STORED THIS EXPORT"
        />
      </label>
      <button
        disabled={
          busy ||
          !selected ||
          confirmation !== "I VERIFIED AND SAFELY STORED THIS EXPORT"
        }
        onClick={() =>
          run(async () => {
            await reauth();
            await request(`/exports/${selected}/acknowledge`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ confirmation }),
            });
            setStatus("Safe-storage acknowledgement recorded.");
            setConfirmation("");
          })
        }
      >
        Acknowledge verified safe storage
      </button>
      <hr />
      <label>
        Include eligible transactions through
        <input
          type="date"
          value={through}
          onChange={(e) => {
            setThrough(e.target.value);
            setPurgePreview(undefined);
          }}
        />
      </label>
      <button
        className="quiet"
        disabled={busy || !selected || !through}
        onClick={() =>
          run(async () => {
            setPurgePreview(
              await post<PurgePreview>("/purge/preview", {
                exportBatchId: selected,
                through,
              }),
            );
          })
        }
      >
        Preview eligible purge
      </button>
      {purgePreview && (
        <>
          <pre>{JSON.stringify(purgePreview, null, 2)}</pre>
          <p className="notice">
            No undo. Type PURGE {purgePreview.count} above and enter your
            password to confirm.
          </p>
          <button
            className="danger"
            disabled={
              busy ||
              purgePreview.count === 0 ||
              confirmation !== `PURGE ${purgePreview.count}`
            }
            onClick={() =>
              run(async () => {
                await reauth();
                await post("/purge/commit", {
                  scope: { exportBatchId: selected, through },
                  previewHash: purgePreview.previewHash,
                  confirmation,
                });
                setStatus(
                  "Eligible payloads purged; evidence and minimal tombstones retained.",
                );
                setPurgePreview(undefined);
                setConfirmation("");
              })
            }
          >
            Permanently purge eligible payloads
          </button>
        </>
      )}
    </section>
  );
}
