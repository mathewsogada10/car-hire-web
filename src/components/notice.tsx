export function Notice({ error }: { error: string }) {
  return error ? (
    <div className="notice" role="alert">
      {error}
    </div>
  ) : null;
}
