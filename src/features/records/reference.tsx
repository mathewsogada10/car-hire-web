import { Notice } from "../../components/notice";
import { schemas } from "./schemas";
import { label } from "./record-label";
import { useReference } from "./hooks/use-reference";

export function Reference({
  kind,
  value,
  onChange,
  required,
}: {
  kind: string;
  value: string;
  onChange: (value: string) => void;
  required: boolean;
}) {
  const { query, setQuery, rows, references, selected, error } = useReference(
    kind,
    value,
  );
  return (
    <div className="reference">
      <input
        aria-label={`Search ${schemas[kind].title}`}
        placeholder={`Search ${schemas[kind].title.toLowerCase()}`}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <select
        aria-label={`Choose ${schemas[kind].title}`}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Choose a record</option>
        {value && !rows.some((r) => r.id === value) && (
          <option value={value}>
            {selected
              ? label(selected, references)
              : "Loading selected record..."}
          </option>
        )}
        {rows.map((r) => (
          <option key={r.id} value={r.id}>
            {label(r, references)}
          </option>
        ))}
      </select>
      <Notice error={error} />
    </div>
  );
}
