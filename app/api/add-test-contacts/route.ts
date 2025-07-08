import { connectToDatabase } from "@/lib/db";
import { Contact } from "@/lib/models";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    await connectToDatabase();

    // Testowe kontakty
    const testContacts = [
      {
        name: "Jan Kowalski",
        email: "jan.kowalski@example.com",
        description: "Manager ds. Logistyki",
      },
      {
        name: "Anna Nowak",
        email: "anna.nowak@example.com",
        description: "Specjalista ds. Transportu",
      },
      {
        name: "Piotr Wiśniewski",
        email: "piotr.wisniewski@example.com",
        description: "Koordynator Dostaw",
      },
      {
        name: "Maria Dąbrowska",
        email: "maria.dabrowska@example.com",
        description: "Analityk Logistyczny",
      },
      {
        name: "Tomasz Lewandowski",
        email: "tomasz.lewandowski@example.com",
        description: "Kierownik Magazynu",
      },
    ];

    const results = {
      added: [] as string[],
      existing: [] as string[],
      errors: [] as string[],
    };

    for (const contactData of testContacts) {
      try {
        // Sprawdź czy kontakt już istnieje
        const existingContact = await Contact.findOne({
          email: contactData.email,
        });

        if (existingContact) {
          results.existing.push(`${contactData.name} (${contactData.email})`);
          continue;
        }

        // Dodaj nowy kontakt
        const contact = new Contact(contactData);
        await contact.save();
        results.added.push(`${contactData.name} (${contactData.email})`);
      } catch (error) {
        results.errors.push(
          `${contactData.email}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        );
      }
    }

    // Pobierz wszystkie kontakty po dodaniu
    const allContacts = await Contact.find().sort({ name: 1 });

    return NextResponse.json({
      success: true,
      message: "Operacja zakończona",
      results,
      totalContacts: allContacts.length,
      allContacts: allContacts.map((c) => ({
        name: c.name,
        email: c.email,
        description: c.description,
      })),
    });
  } catch (error) {
    console.error("❌ Błąd dodawania kontaktów testowych:", error);
    return NextResponse.json(
      { success: false, error: "Błąd dodawania kontaktów testowych" },
      { status: 500 },
    );
  }
}
