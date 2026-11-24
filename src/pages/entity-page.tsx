import { Notice } from "../components/notice";
import { RecordForm } from "../features/records/record-form";
import { RecordFilters } from "../features/records/record-filters";
import { RecordsTable } from "../features/records/records-table";
import { DeleteRecordDialog } from "../features/records/delete-record-dialog";
import { useEntityRecords } from "../features/records/hooks/use-entity-records";
import { schemas } from "../features/records/schemas";
import { displayMoney } from "../utilities/money";

export function EntityPage({ kind }: { kind: string }) {
  const records = useEntityRecords(kind);
  const {
    query,
    setQuery,
    from,
    setFrom,
    to,
    setTo,
    status,
    setStatus,
    page,
    setPage,
    rows,
    references,
    amountTotalMinor,
    total,
    error,
    loading,
    setRefresh,
    editing,
    setEditing,
    deleting,
    setDeleting,
    deleteRecord,
  } = records;
  if (editing)
    return (
      <RecordForm
        key={editing === "new" ? "new" : editing.id}
        kind={kind}
        row={editing === "new" ? undefined : editing}
        close={() => setEditing(null)}
        saved={() => {
          setEditing(null);
          setRefresh((v) => v + 1);
        }}
      />
    );
  return (
    <>
      <div className="section-head">
        <div>
          <p className="eyebrow">OWNER WORKSPACE</p>
          <h1>{schemas[kind].title}</h1>
          {kind === "hires" && (
            <p>Ordered by planned pickup (earliest first)</p>
          )}
        </div>
        <button onClick={() => setEditing("new")}>
          + Add {kind === "hires" ? "hire" : "record"}
        </button>
      </div>
      <RecordFilters
        kind={kind}
        query={query}
        setQuery={setQuery}
        from={from}
        setFrom={setFrom}
        to={to}
        setTo={setTo}
        status={status}
        setStatus={setStatus}
        setPage={setPage}
      />
      <Notice error={error} />
      {!loading &&
        !error &&
        ["hires", "payments", "expenses"].includes(kind) && (
          <p role="status" data-testid="filtered-total">
            Filtered total: <strong>{displayMoney(amountTotalMinor)}</strong>{" "}
            across {total} matching records (all pages).
            {kind === "payments" &&
              " Sum of entry amounts, not net cash or balance due."}
          </p>
        )}
      {loading ? (
        <p role="status">Loading records...</p>
      ) : rows.length === 0 ? (
        <div className="empty">
          <h2>No records yet</h2>
          <p>Add a record or adjust your filters.</p>
        </div>
      ) : (
        <RecordsTable
          kind={kind}
          rows={rows}
          references={references}
          onEdit={setEditing}
          onDelete={setDeleting}
        />
      )}
      <div className="pagination">
        <span>
          {total} records | Page {page + 1}
        </span>
        <button
          className="quiet"
          disabled={page === 0}
          onClick={() => setPage((p) => p - 1)}
        >
          Previous
        </button>
        <button
          className="quiet"
          disabled={(page + 1) * 25 >= total}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </button>
        <button className="quiet" onClick={() => setRefresh((n) => n + 1)}>
          Refresh
        </button>
      </div>
      {deleting && (
        <DeleteRecordDialog
          row={deleting}
          confirm={deleteRecord}
          cancel={() => setDeleting(null)}
        />
      )}
    </>
  );
}
