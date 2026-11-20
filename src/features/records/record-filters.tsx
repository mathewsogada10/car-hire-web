import type { useEntityRecords } from "./hooks/use-entity-records";
import { schemas } from "./schemas";

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
  const statuses =
    schemas[kind].fields.find((field) => field.key === "status")?.options ?? [];
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
      {(statuses.length > 0 || status) && (
        <label>
          Status
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(0);
            }}
          >
            <option value="">All statuses</option>
            {status && !statuses.includes(status) && (
              <option value={status} disabled>
                Unsupported status: {status} - select a defined status
              </option>
            )}
            {statuses.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}
