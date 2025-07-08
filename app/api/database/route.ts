import {
  getAllRecords,
  getDatabaseStats,
  getRecordsByFile,
  searchRecords,
} from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const stats = searchParams.get("stats");
    const search = searchParams.get("search");
    const field = searchParams.get("field");
    const filename = searchParams.get("filename");

    if (stats === "true") {
      const statistics = await getDatabaseStats();
      return NextResponse.json(statistics);
    }

    let records;

    if (search) {
      records = await searchRecords(search, field || undefined);
    } else if (filename) {
      records = await getRecordsByFile(filename);
    } else {
      records = await getAllRecords();
    }

    const formattedRecords = records.map((record: any) => ({
      ...record.data,
      _metadata: {
        id: record._id,
        filename: record.fileId?.filename || "Unknown",
        uploadDate: record.fileId?.uploadDate,
        createdAt: record.createdAt,
        hash: record.hash,
      },
    }));

    return NextResponse.json({
      success: true,
      data: formattedRecords,
      count: records.length,
    });
  } catch (error: any) {
    console.error("Błąd pobierania z MongoDB:", error);
    return NextResponse.json(
      { error: `Błąd pobierania danych: ${error.message}` },
      { status: 500 },
    );
  }
}
