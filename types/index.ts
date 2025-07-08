export interface CsvRecord {
  id: string;
  data: Record<string, any>;
  filename: string;
  uploadDate: Date;
  createdAt: Date;
}

export interface DatabaseStats {
  totalFiles: number;
  totalRecords: number;
  latestFile?: {
    filename: string;
    uploadDate: Date;
  };
}

export interface UploadResult {
  saved: number;
  duplicates: number;
  total: number;
}
