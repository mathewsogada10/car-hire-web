import { useEffect, useState } from "react";
import { api, message } from "../services/api";
import { Notice } from "../components/notice";

export function Evidence({ audit = false }: { audit?: boolean }) {
  const [data, setData] = useState<unknown>();
  const [error, setError] = useState("");
  useEffect(() => {
    api<unknown>(audit ? "/audit" : "/data-health")
      .then(setData)
      .catch((e) => setError(message(e)));
  }, [audit]);
  return (
    <>
      <h1>{audit ? "Audit trail" : "Sync & data health"}</h1>
      <p>
        {audit
          ? "Append-only actor/action/time evidence. Sensitive payloads are represented by hashes."
          : "Android sync uses durable local outbox and revision-checked push/pull. This web client reads authoritative server data online."}
      </p>
      <Notice error={error} />
      <pre className="panel">{JSON.stringify(data, null, 2)}</pre>
    </>
  );
}
