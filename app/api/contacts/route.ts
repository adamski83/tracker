import { connectToDatabase } from "@/lib/db";
import { Contact } from "@/lib/models";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    await connectToDatabase();
    const contacts = await Contact.find().sort({ name: 1 });

    return NextResponse.json({
      success: true,
      contacts,
    });
  } catch (error) {
    console.error("❌ Błąd pobierania kontaktów:", error);
    return NextResponse.json(
      { success: false, error: "Błąd pobierania kontaktów" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const { name, email, description } = await request.json();

    if (!name || !email) {
      return NextResponse.json(
        { success: false, error: "Nazwa i email są wymagane" },
        { status: 400 },
      );
    }

    // Sprawdź czy kontakt już istnieje
    const existingContact = await Contact.findOne({ email });
    if (existingContact) {
      return NextResponse.json(
        { success: false, error: "Kontakt z tym emailem już istnieje" },
        { status: 409 },
      );
    }

    const contact = new Contact({
      name,
      email,
      description: description || "",
    });

    await contact.save();

    return NextResponse.json({
      success: true,
      contact,
      message: "Kontakt został dodany",
    });
  } catch (error) {
    console.error("❌ Błąd dodawania kontaktu:", error);
    return NextResponse.json(
      { success: false, error: "Błąd dodawania kontaktu" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const contactId = searchParams.get("id");

    if (!contactId) {
      return NextResponse.json(
        { success: false, error: "ID kontaktu jest wymagane" },
        { status: 400 },
      );
    }

    const deletedContact = await Contact.findByIdAndDelete(contactId);

    if (!deletedContact) {
      return NextResponse.json(
        { success: false, error: "Kontakt nie został znaleziony" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Kontakt został usunięty",
    });
  } catch (error) {
    console.error("❌ Błąd usuwania kontaktu:", error);
    return NextResponse.json(
      { success: false, error: "Błąd usuwania kontaktu" },
      { status: 500 },
    );
  }
}
