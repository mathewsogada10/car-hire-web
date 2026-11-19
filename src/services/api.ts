import { z } from "zod";
import type { components } from "../openapi";

export type Value = string | number | boolean | null;
export type Data = Record<string, Value>;
const rowSchema = z.object({
  id: z.uuid(),
  kind: z.string(),
  revision: z.number().int(),
  data: z.record(
    z.string(),
    z.union([z.string(), z.number(), z.boolean(), z.null()]),
  ),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable(),
});
export type Row = z.infer<typeof rowSchema>;
export const pageSchema = z.object({
  items: z.array(rowSchema),
  total: z.number(),
  page: z.number(),
  size: z.number(),
});
export type Page = z.infer<typeof pageSchema>;
type ApiChange = components["schemas"]["Change"];
export interface Change extends ApiChange {
  data: Data;
}
export interface ChangeResult {
  outcome: "Accepted" | "Unchanged" | "Conflict";
  record?: Row;
  server?: Row;
  local?: Change;
}
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public detail?: unknown,
  ) {
    super(message);
  }
}
let token: { token: string; headerName: string } | undefined;
export async function csrf() {
  const value = await fetch("/api/v1/auth/csrf", {
    credentials: "same-origin",
  }).then((r) => {
    if (!r.ok)
      throw new ApiError(r.status, "Unable to initialize secure session");
    return r.json() as Promise<{ token: string; headerName: string }>;
  });
  token = value;
  return value;
}
export async function request(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(init.headers);
  if (init.method && init.method !== "GET") {
    const t = token ?? (await csrf());
    headers.set(t.headerName, t.token);
  }
  const response = await fetch(`/api/v1${path}`, {
    ...init,
    headers,
    credentials: "same-origin",
  });
  if (!response.ok) {
    let message =
      response.status === 401
        ? "Session expired. Sign in again; your form has been retained."
        : `Request failed (${response.status})`;
    let detail: unknown;
    if (response.headers.get("content-type")?.includes("json")) {
      const body: unknown = await response.json();
      if (
        typeof body === "object" &&
        body !== null &&
        "message" in body &&
        typeof body.message === "string"
      )
        message = body.message;
      if (typeof body === "object" && body !== null && "detail" in body)
        detail = body.detail;
    }
    if (response.status === 401)
      window.dispatchEvent(new Event("session-expired"));
    if (response.status === 403) token = undefined;
    throw new ApiError(response.status, message, detail);
  }
  return response;
}
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  return (await request(path, init)).json() as Promise<T>;
}
export function post<T>(path: string, body: unknown): Promise<T> {
  return api<T>(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
export async function list(
  kind: string,
  params = new URLSearchParams(),
): Promise<Page> {
  return pageSchema.parse(await api<unknown>(`/records/${kind}?${params}`));
}
export async function save(change: Change) {
  const result = await post<ChangeResult>("/changes", change);
  if (result.outcome === "Conflict")
    throw new ApiError(
      409,
      "This record changed elsewhere. Review the current server version before making a new revision.",
      result,
    );
  if (!result.record) throw new Error("Server response omitted saved record");
  return rowSchema.parse(result.record);
}
export function message(e: unknown): string {
  return e instanceof Error
    ? e.message
    : "Unexpected failure; no success has been confirmed.";
}
export async function download(path: string, name: string, init?: RequestInit) {
  const response = await request(path, init);
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export const SETTINGS_ID = "00000000-0000-4000-8000-000000000001";
