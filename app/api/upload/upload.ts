import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";
import pdfParse from "pdf-parse";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "Brak pliku" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let data: any[] = [];

    if (file.name.endsWith(".csv")) {
      // Przetwarzanie pliku CSV
      const csvText = buffer.toString("utf-8");
      const parseResult = Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        delimiter: ",",
      });
      data = parseResult.data;
    } else if (file.name.endsWith(".pdf")) {
      // Przetwarzanie pliku PDF
      const pdfData = await pdfParse(buffer);
      data = [
        {
          filename: file.name,
          text: pdfData.text,
          pages: pdfData.numpages,
          info: pdfData.info,
        },
      ];
    } else {
      return NextResponse.json(
        { error: "Nieobsługiwany typ pliku" },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      data,
      filename: file.name,
      type: file.type,
    });
  } catch (error) {
    console.error("Błąd przetwarzania pliku:", error);
    return NextResponse.json(
      { error: "Błąd przetwarzania pliku" },
      { status: 500 },
    );
  }
}
