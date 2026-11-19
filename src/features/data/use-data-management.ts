import { useEffect, useState } from "react";
import { api, message, post } from "../../services/api";
import type { ExportBatch, ImportPreview, PurgePreview } from "./types";

export function useDataManagement() {
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [batches, setBatches] = useState<ExportBatch[]>([]);
  const [selected, setSelected] = useState("");
  const [through, setThrough] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [file, setFile] = useState<File>();
  const [importPreview, setImportPreview] = useState<ImportPreview>();
  const [purgePreview, setPurgePreview] = useState<PurgePreview>();
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    api<ExportBatch[]>("/exports")
      .then(setBatches)
      .catch((e) => setError(message(e)));
  }, [refresh]);
  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError("");
    setStatus("");
    try {
      await action();
      setRefresh((n) => n + 1);
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  async function reauth() {
    await post("/auth/reauth", { password });
    setPassword("");
  }

  return {
    error,
    status,
    setStatus,
    busy,
    batches,
    selected,
    setSelected,
    through,
    setThrough,
    password,
    setPassword,
    confirmation,
    setConfirmation,
    file,
    setFile,
    importPreview,
    setImportPreview,
    purgePreview,
    setPurgePreview,
    run,
    reauth,
  };
}
export type DataManagementState = ReturnType<typeof useDataManagement>;
