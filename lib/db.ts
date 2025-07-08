import crypto from "crypto";
import mongoose from "mongoose";

// Prosty connection string
const MONGODB_URI = "mongodb://localhost:27017/csvreader";

// Proste połączenie bez cache
export async function connectToDatabase() {
  if (mongoose.connection.readyState === 0) {
    console.log("🔌 Łączę z MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Połączono z MongoDB");
  }
  return mongoose;
}

// Proste modele inline
const CsvFileSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true, unique: true },
    uploadDate: { type: Date, default: Date.now },
    recordCount: { type: Number, required: true },
  },
  { timestamps: true },
);

const CsvRecordSchema = new mongoose.Schema(
  {
    fileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CsvFile",
      required: true,
    },
    data: { type: Object, required: true },
    hash: { type: String, required: true, unique: true },
  },
  { timestamps: true },
);

export const CsvFile =
  mongoose.models.CsvFile || mongoose.model("CsvFile", CsvFileSchema);
export const CsvRecord =
  mongoose.models.CsvRecord || mongoose.model("CsvRecord", CsvRecordSchema);

export function createRecordHash(record: any): string {
  const recordString = JSON.stringify(record, Object.keys(record).sort());
  return crypto.createHash("md5").update(recordString).digest("hex");
}

export async function saveCsvToDatabase(filename: string, records: any[]) {
  try {
    console.log("💾 Zapisuję do MongoDB:", filename);
    await connectToDatabase();

    // Znajdź lub utwórz plik
    let csvFile = await CsvFile.findOne({ filename });
    if (!csvFile) {
      csvFile = await CsvFile.create({
        filename,
        recordCount: records.length,
      });
      console.log("📄 Utworzono plik:", filename);
    }

    let savedCount = 0;
    let duplicateCount = 0;

    // Zapisz rekordy
    for (const record of records) {
      const hash = createRecordHash(record);

      const exists = await CsvRecord.findOne({ hash });
      if (!exists) {
        await CsvRecord.create({
          fileId: csvFile._id,
          data: record,
          hash,
        });
        savedCount++;
      } else {
        duplicateCount++;
      }
    }

    console.log("✅ Zapisano:", savedCount, "duplikaty:", duplicateCount);

    return {
      saved: savedCount,
      duplicates: duplicateCount,
      total: records.length,
    };
  } catch (error: any) {
    console.error("❌ Błąd zapisu:", error.message);
    throw error;
  }
}

export async function getAllRecords() {
  await connectToDatabase();
  return await CsvRecord.find()
    .populate("fileId")
    .sort({ createdAt: -1 })
    .lean();
}

export async function getDatabaseStats() {
  await connectToDatabase();
  const totalFiles = await CsvFile.countDocuments();
  const totalRecords = await CsvRecord.countDocuments();
  const latestFile = await CsvFile.findOne().sort({ uploadDate: -1 }).lean();

  return { totalFiles, totalRecords, latestFile };
}

export async function getRecordsByFile(filename: string) {
  await connectToDatabase();
  const csvFile = await CsvFile.findOne({ filename });
  if (!csvFile) return [];

  return await CsvRecord.find({ fileId: csvFile._id })
    .populate("fileId")
    .sort({ createdAt: -1 })
    .lean();
}

export async function searchRecords(searchTerm: string, field?: string) {
  await connectToDatabase();

  if (!searchTerm) return await getAllRecords();

  if (field && field !== "all") {
    const query = { [`data.${field}`]: { $regex: searchTerm, $options: "i" } };
    return await CsvRecord.find(query)
      .populate("fileId")
      .sort({ createdAt: -1 })
      .lean();
  } else {
    const allRecords = await CsvRecord.find().populate("fileId").lean();
    return allRecords.filter((record) => {
      const dataString = JSON.stringify(record.data).toLowerCase();
      return dataString.includes(searchTerm.toLowerCase());
    });
  }
}
