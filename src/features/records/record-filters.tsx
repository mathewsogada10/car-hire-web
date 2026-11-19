import type { useEntityRecords } from "./hooks/use-entity-records";

type FilterProps = Pick<
  ReturnType<typeof useEntityRecords>,
  | "query"
  | "setQuery"
  | "from"
  | "setFrom"
  | "to"
  | "setTo"
  | "status"
  | "setStatus"
  | "setPage"
> & { kind: string };
export function RecordFilters({
  kind,
  query,
  setQuery,
  from,
  setFrom,
  to,
  setTo,
  status,
  setStatus,
  setPage,
}: FilterProps) {
  return (
    <div className="filters">
      <label>
        Search
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(0);
          }}
          placeholder="Search records"
        />
      </label>
      {[
        "hires",
        "payments",
        "expenses",
        "maintenance",
        "readings",
        "damages",
      ].includes(kind) && (
        <>
          <label>
            From
            <input
              type="date"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value);
                setPage(0);
              }}
            />
          </label>
          <label>
            Through
            <input
              type="date"
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                setPage(0);
              }}
            />
          </label>
        </>
      )}
      <label>
        Status
        <input
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(0);
          }}
          placeholder="All statuses"
        />
      </label>
    </div>
  );
}
