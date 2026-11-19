import { useEffect, useState } from "react";
import { api, download, message, request } from "../../services/api";
import type { Row } from "../../services/api";
import { Notice } from "../../components/notice";

export function Attachments({ row }: { row: Row }) {
  const [items, setItems] = useState<{ id: string; filename: string }[]>([]);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let active = true;
    api<{ id: string; filename: string }[]>(`/attachments?parentId=${row.id}`)
      .then((v) => {
        if (active) setItems(v);
      })
      .catch((e) => {
        if (active) setError(message(e));
      });
    return () => {
      active = false;
    };
  }, [row.id, refresh]);
  return (
    <section>
      <h3>Receipts & attachments</h3>
      <p className="muted">
        Private PDF, PNG or JPEG. Up to 20 files, 20 MiB each.
      </p>
      <input
        aria-label="Upload attachment"
        type="file"
        accept="image/png,image/jpeg,application/pdf"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const body = new FormData();
          body.append("file", file);
          try {
            await request(`/attachments?parentId=${row.id}`, {
              method: "POST",
              body,
            });
            setRefresh((n) => n + 1);
            setError("");
          } catch (error) {
            setError(message(error));
          }
        }}
      />
      {items.map((item) => (
        <button
          key={item.id}
          className="quiet"
          onClick={() => {
            download(`/attachments/${item.id}`, item.filename).catch((e) =>
              setError(message(e)),
            );
          }}
        >
          {item.filename}
        </button>
      ))}
      <Notice error={error} />
    </section>
  );
}
