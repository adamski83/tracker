import { connectToDatabase } from "@/lib/db";
import { CsvFile } from "@/lib/models";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    console.log("🔍 Sprawdzanie połączenia z MongoDB...");

    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      return NextResponse.json({
        success: false,
        error: "DATABASE_URL nie jest zdefiniowane",
      });
    }

    const _connection = await connectToDatabase();
    const testCount = await CsvFile.countDocuments();

    return NextResponse.json({
      success: true,
      message: "Połączenie z MongoDB działa!",
      database: {
        url: dbUrl.substring(0, 20) + "...",
        status: "connected",
        filesCount: testCount,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    );
  }
}
