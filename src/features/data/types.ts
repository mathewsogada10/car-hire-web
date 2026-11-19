export interface ExportBatch {
  id: string;
  state: string;
  created_at: string;
}
export interface ImportPreview {
  packageHash: string;
  inserted: number;
  unchanged: number;
  conflicted: string[];
  status: string;
}
export interface PurgePreview {
  count: number;
  previewHash: string;
  excludedReasons: Record<string, number>;
  warning: string;
}
