import { Notice } from "../components/notice";
import { useDataManagement } from "../features/data/use-data-management";
import { ExportPanel } from "../features/data/export-panel";
import { ImportPanel } from "../features/data/import-panel";
import { PurgePanel } from "../features/data/purge-panel";

export function DataManagement() {
  const state = useDataManagement();
  const { error, status } = state;
  return (
    <>
      <h1>Data & imports</h1>
      <p className="muted">
        Portable exports are not encrypted full-device backups. Export never
        automatically deletes records.
      </p>
      <Notice error={error} />
      {status && (
        <p role="status" className="success">
          {status}
        </p>
      )}
      <ExportPanel state={state} />
      <ImportPanel state={state} />
      <PurgePanel state={state} />
    </>
  );
}
