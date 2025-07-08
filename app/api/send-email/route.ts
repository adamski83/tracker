import { connectToDatabase } from "@/lib/db";
import { EmailHistory } from "@/lib/models";
import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

// Konfig            return `"${value.replace(/"/g, "\"\"")}"`;'racja nodemailer (możesz dostosować do swojego providera)
const createTransporter = () => {
  // Sprawdź czy używamy Gmail
  if (process.env.EMAIL_USER?.includes("gmail.com")) {
    return nodemailer.createTransport({
      // Konfiguracja dedykowana dla Gmail
      host: "smtp.gmail.com",
      port: 587,
      secure: false, // true dla 465, false dla 587
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false, // Pozwala na self-signed certificates w dev
      },
    });
  } else {
    // Domyślna konfiguracja
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
      secure: false,
      requireTLS: true,
    });
  }
};

export async function POST(request: NextRequest) {
  let requestData: {
    to?: string;
    subject?: string;
    message?: string;
    attachData?: Record<string, unknown>[];
  } = {};

  try {
    await connectToDatabase();
    requestData = await request.json();
    const { to, subject, message, attachData } = requestData;

    if (!to || !subject || !message) {
      return NextResponse.json(
        { success: false, error: "Email, temat i wiadomość są wymagane" },
        { status: 400 },
      );
    }

    // Walidacja emaila
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return NextResponse.json(
        { success: false, error: "Nieprawidłowy format emaila" },
        { status: 400 },
      );
    }

    const transporter = createTransporter();

    // Testuj połączenie przed wysłaniem
    try {
      await transporter.verify();
      console.log("✅ Połączenie SMTP zweryfikowane");
    } catch (verifyError) {
      console.warn("⚠️ Błąd weryfikacji SMTP:", verifyError);
      // Kontynuuj mimo błędu weryfikacji
    }

    // Przygotuj opcje maila
    const mailOptions = {
      from: process.env.EMAIL_USER || "your-email@gmail.com",
      to,
      subject,
      html: `
				<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
					<h2 style="color: #333;">UPS Tracker - Raport</h2>
					<div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px;">
						${message.replace(/\n/g, "<br>")}
					</div>
					<hr style="margin: 20px 0;">
					<small style="color: #666;">
						Wysłane z UPS Tracker - ${new Date().toLocaleString("pl-PL")}
					</small>
				</div>
			`,
      attachments: [] as Array<{
        filename: string;
        content: string;
        contentType: string;
      }>,
    };

    // Dodaj załącznik z danymi CSV jeśli zostały podane
    if (attachData && Array.isArray(attachData) && attachData.length > 0) {
      // Konwertuj dane do CSV
      const csvContent = convertToCSV(attachData);

      mailOptions.attachments = [
        {
          filename: `ups_tracker_data_${
            new Date().toISOString().split("T")[0]
          }.csv`,
          content: csvContent,
          contentType: "text/csv",
        },
      ];
    }

    // Wyślij email
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email wysłany:", info.messageId);

    // Zapisz w historii
    const emailHistory = new EmailHistory({
      to,
      subject,
      message,
      attachmentInfo: attachData
        ? `CSV file with ${attachData.length} records`
        : "",
      status: "sent",
    });

    await emailHistory.save();

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
      message: "Email został wysłany",
    });
  } catch (error: unknown) {
    console.error("❌ Błąd wysyłania emaila:", error);

    // Zapisz błąd w historii
    try {
      const emailHistory = new EmailHistory({
        to: requestData.to || "unknown",
        subject: requestData.subject || "unknown",
        message: requestData.message || "unknown",
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });
      await emailHistory.save();
    } catch (historyError) {
      console.error("❌ Błąd zapisywania historii:", historyError);
    }

    return NextResponse.json(
      {
        success: false,
        error: `Błąd wysyłania emaila: ${
          error instanceof Error ? error.message : "Nieznany błąd"
        }`,
      },
      { status: 500 },
    );
  }
}

// Funkcja pomocnicza do konwersji danych do CSV
function convertToCSV(data: Record<string, unknown>[]): string {
  if (!data || data.length === 0) return "";

  // Pobierz nagłówki z pierwszego obiektu (pomijając _metadata)
  const firstItem = data[0];

  const { _metadata: _, ...cleanItem } = firstItem;
  const headers = Object.keys(cleanItem);

  // Utwórz nagłówek CSV
  const csvHeaders = headers.join(",");

  // Utwórz wiersze CSV
  const csvRows = data
    .map((row) => {
      const { _metadata: __, ...cleanRow } = row;
      return headers
        .map((header) => {
          const value = cleanRow[header];
          // Escape wartości zawierające przecinki lub cudzysłowy
          if (
            typeof value === "string" &&
            (value.includes(",") || value.includes("\""))
          ) {
            return `"${value.replace(/"/g, "\"\"")}"`;
          }
          return value;
        })
        .join(",");
    })
    .join("\n");

  return csvHeaders + "\n" + csvRows;
}

// Endpoint do pobierania historii emaili
export async function GET() {
  try {
    await connectToDatabase();
    const history = await EmailHistory.find().sort({ sentAt: -1 }).limit(50); // Ostatnie 50 emaili

    return NextResponse.json({
      success: true,
      history,
    });
  } catch (error) {
    console.error("❌ Błąd pobierania historii emaili:", error);
    return NextResponse.json(
      { success: false, error: "Błąd pobierania historii emaili" },
      { status: 500 },
    );
  }
}
