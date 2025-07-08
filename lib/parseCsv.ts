import fs from "fs";
import Papa from "papaparse";

export function parseCsvFile(filePath: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const file = fs.createReadStream(filePath);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        resolve(result.data as any[]);
      },
      error: reject,
    });
  });
}
