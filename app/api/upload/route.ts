import { saveCsvToDatabase } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "Brak pliku" }, { status: 400 });
    }

    if (!file.name.endsWith(".csv")) {
      return NextResponse.json(
        { error: "Tylko pliki CSV są obsługiwane" },
        { status: 400 },
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const csvText = Buffer.from(arrayBuffer).toString("utf-8");

    // Przetwarzanie CSV
    const parseResult = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      delimiter: ",",
    });

    console.log("=== DANE CSV W KONSOLI SERWERA ===");
    console.log("Nazwa pliku:", file.name);
    console.log("Liczba rekordów:", parseResult.data.length);
    console.log("JSON:");
    console.log(JSON.stringify(parseResult.data, null, 2));
    console.log("=== KONIEC DANYCH CSV ===");

    // Zapisz do bazy danych (jeśli jest skonfigurowana)
    let dbResult = { saved: 0, duplicates: 0, total: parseResult.data.length };

    try {
      dbResult = await saveCsvToDatabase(file.name, parseResult.data);
      console.log("=== ZAPISANO DO BAZY DANYCH ===");
      console.log("Nowe rekordy:", dbResult.saved);
      console.log("Duplikaty:", dbResult.duplicates);
      console.log("=== KONIEC ZAPISU ===");
    } catch (dbError) {
      console.warn("Błąd bazy danych (kontynuuję bez zapisu):", dbError);
      // Kontynuuj bez zapisu do bazy
    }

    return NextResponse.json({
      success: true,
      data: parseResult.data,
      filename: file.name,
      recordCount: parseResult.data.length,
      database: dbResult,
    });
  } catch (error) {
    console.error("Błąd przetwarzania CSV:", error);
    return NextResponse.json(
      { error: "Błąd przetwarzania pliku CSV" },
      { status: 500 },
    );
  }
}
