import { connectToDatabase } from "@/lib/db";
import { Contact } from "@/lib/models";

// Przykładowe kontakty testowe
const testContacts = [
  {
    name: "Jan Kowalski",
    email: "jan.kowalski@ups-test.com",
    description: "Manager logistyki - region północny",
  },
  {
    name: "Anna Nowak",
    email: "anna.nowak@ups-test.com",
    description: "Kierownik działu wysyłek",
  },
  {
    name: "Piotr Wiśniewski",
    email: "piotr.wisniewski@ups-test.com",
    description: "Analityk danych transportowych",
  },
  {
    name: "Maria Kowalczyk",
    email: "maria.kowalczyk@ups-test.com",
    description: "Dyrektor operacyjny",
  },
  {
    name: "Tomasz Lewandowski",
    email: "tomasz.lewandowski@ups-test.com",
    description: "Koordynator dostaw - region południowy",
  },
];

async function addTestContacts() {
  try {
    await connectToDatabase();
    console.log("🔌 Połączono z bazą danych");

    for (const contactData of testContacts) {
      try {
        // Sprawdź czy kontakt już istnieje
        const existingContact = await Contact.findOne({
          email: contactData.email,
        });

        if (existingContact) {
          console.log(`⚠️  Kontakt ${contactData.email} już istnieje`);
          continue;
        }

        // Dodaj nowy kontakt
        const contact = new Contact(contactData);
        await contact.save();
        console.log(
          `✅ Dodano kontakt: ${contactData.name} (${contactData.email})`,
        );
      } catch (error) {
        console.error(
          `❌ Błąd dodawania kontaktu ${contactData.email}:`,
          error,
        );
      }
    }

    console.log("\n🎉 Zakończono dodawanie kontaktów testowych!");

    // Pokaż wszystkie kontakty
    const allContacts = await Contact.find().sort({ name: 1 });
    console.log(`\n📋 Wszystkie kontakty w bazie (${allContacts.length}):`);
    allContacts.forEach((contact) => {
      console.log(`  • ${contact.name} - ${contact.email}`);
      if (contact.description) {
        console.log(`    ${contact.description}`);
      }
    });
  } catch (error) {
    console.error("❌ Błąd połączenia z bazą:", error);
  }
}

// Uruchom tylko jeśli plik jest wywoływany bezpośrednio
if (require.main === module) {
  addTestContacts();
}

export { addTestContacts };
