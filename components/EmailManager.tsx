"use client";

import { useEffect, useState } from "react";

interface Contact {
  _id: string;
  name: string;
  email: string;
  description?: string;
  createdAt: string;
}

interface EmailHistory {
  _id: string;
  to: string;
  subject: string;
  message: string;
  attachmentInfo?: string;
  sentAt: string;
  status: "sent" | "failed";
  error?: string;
}

interface EmailManagerProps {
  data?: Record<string, unknown>[];
  onRef?: (ref: {
    addColumnDataToMessage: (columnName: string, columnData: string[]) => void;
    addRowDataToMessage: (
      rowData: Record<string, unknown>,
      rowIndex: number,
    ) => void;
  }) => void;
}

export default function EmailManager({ data, onRef }: EmailManagerProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [emailHistory, setEmailHistory] = useState<EmailHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"send" | "contacts" | "history">(
    "send",
  );

  // Form states
  const [emailForm, setEmailForm] = useState({
    to: [] as string[], // Zmieniam na array dla wielu adresatów
    subject: "",
    message: "",
    attachData: false,
  });

  const [currentEmail, setCurrentEmail] = useState(""); // Pole do wpisywania nowego emaila
  const [searchTerm, setSearchTerm] = useState(""); // Pole do wyszukiwania kontaktów

  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    description: "",
  });

  // Załaduj kontakty przy starcie
  useEffect(() => {
    loadContacts();
    loadEmailHistory();
  }, []);

  // Przekaż referencję do funkcji do komponentu nadrzędnego
  useEffect(() => {
    if (onRef) {
      onRef({
        addColumnDataToMessage,
        addRowDataToMessage,
      });
    }
  }, [onRef]);

  const loadContacts = async () => {
    try {
      const res = await fetch("/api/contacts");
      const json = await res.json();
      if (json.success) {
        setContacts(json.contacts);
      }
    } catch (error) {
      console.error("Błąd ładowania kontaktów:", error);
    }
  };

  const loadEmailHistory = async () => {
    try {
      const res = await fetch("/api/send-email");
      const json = await res.json();
      if (json.success) {
        setEmailHistory(json.history);
      }
    } catch (error) {
      console.error("Błąd ładowania historii:", error);
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();

    if (emailForm.to.length === 0) {
      alert("Dodaj przynajmniej jednego odbiorcę");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        to: emailForm.to.join(", "), // Połącz emaile przecinkami dla nodemailer
        subject: emailForm.subject,
        message: emailForm.message,
        attachData: emailForm.attachData ? data : null,
      };

      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (json.success) {
        alert("Email został wysłany!");
        setEmailForm({ to: [], subject: "", message: "", attachData: false });
        setCurrentEmail("");
        loadEmailHistory(); // Odśwież historię
      } else {
        alert(`Błąd: ${json.error}`);
      }
    } catch (error) {
      console.error("Błąd wysyłania emaila:", error);
      alert("Błąd wysyłania emaila");
    } finally {
      setLoading(false);
    }
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contactForm),
      });

      const json = await res.json();

      if (json.success) {
        alert("Kontakt został dodany!");
        setContactForm({ name: "", email: "", description: "" });
        loadContacts(); // Odśwież listę kontaktów
      } else {
        alert(`Błąd: ${json.error}`);
      }
    } catch (error) {
      console.error("Błąd dodawania kontaktu:", error);
      alert("Błąd dodawania kontaktu");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!confirm("Czy na pewno chcesz usunąć ten kontakt?")) return;

    try {
      const res = await fetch(`/api/contacts?id=${contactId}`, {
        method: "DELETE",
      });

      const json = await res.json();

      if (json.success) {
        alert("Kontakt został usunięty!");
        loadContacts(); // Odśwież listę kontaktów
      } else {
        alert(`Błąd: ${json.error}`);
      }
    } catch (error) {
      console.error("Błąd usuwania kontaktu:", error);
      alert("Błąd usuwania kontaktu");
    }
  };

  const handleAddTestContacts = async () => {
    if (!confirm("Czy chcesz dodać 5 testowych kontaktów?")) return;

    setLoading(true);
    try {
      const res = await fetch("/api/add-test-contacts", {
        method: "POST",
      });

      const json = await res.json();

      if (json.success) {
        const { results } = json;
        let message = "Operacja zakończona!\n\n";

        if (results.added.length > 0) {
          message += `✅ Dodano (${
            results.added.length
          }):\n${results.added.join("\n")}\n\n`;
        }

        if (results.existing.length > 0) {
          message += `ℹ️ Już istniały (${
            results.existing.length
          }):\n${results.existing.join("\n")}\n\n`;
        }

        if (results.errors.length > 0) {
          message += `❌ Błędy (${
            results.errors.length
          }):\n${results.errors.join("\n")}\n\n`;
        }

        message += `📊 Łącznie kontaktów w bazie: ${json.totalContacts}`;

        alert(message);
        loadContacts(); // Odśwież listę kontaktów
      } else {
        alert(`Błąd: ${json.error}`);
      }
    } catch (error) {
      console.error("Błąd dodawania testowych kontaktów:", error);
      alert("Błąd dodawania testowych kontaktów");
    } finally {
      setLoading(false);
    }
  };

  const selectContact = (contact: Contact) => {
    // Dodaj kontakt do listy odbiorców jeśli jeszcze nie istnieje
    setEmailForm((prev) => ({
      ...prev,
      to: prev.to.includes(contact.email)
        ? prev.to
        : [...prev.to, contact.email],
    }));
    setActiveTab("send");
  };

  // Funkcje do zarządzania adresatami
  const addEmailRecipient = () => {
    if (!currentEmail.trim()) return;

    // Walidacja emaila
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(currentEmail)) {
      alert("Nieprawidłowy format emaila");
      return;
    }

    // Sprawdź czy email już nie istnieje
    if (emailForm.to.includes(currentEmail)) {
      alert("Ten adres email już został dodany");
      return;
    }

    // Dodaj email do listy
    setEmailForm((prev) => ({
      ...prev,
      to: [...prev.to, currentEmail],
    }));
    setCurrentEmail("");
  };

  const removeEmailRecipient = (emailToRemove: string) => {
    setEmailForm((prev) => ({
      ...prev,
      to: prev.to.filter((email) => email !== emailToRemove),
    }));
  };

  // Funkcja filtrowania kontaktów
  const filteredContacts = contacts.filter((contact) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      contact.name.toLowerCase().includes(searchLower) ||
      contact.email.toLowerCase().includes(searchLower) ||
      contact.description?.toLowerCase().includes(searchLower)
    );
  });

  // Funkcja do dodawania danych kolumny do wiadomości
  const addColumnDataToMessage = (columnName: string, columnData: string[]) => {
    const columnText = `\n\n--- Dane z kolumny "${columnName}" ---\n${columnData.join("\n")}\n--- Koniec danych ---\n`;

    setEmailForm((prev) => ({
      ...prev,
      message: prev.message + columnText,
    }));
  };

  // Funkcja do dodawania danych wiersza do wiadomości
  const addRowDataToMessage = (
    rowData: Record<string, unknown>,
    rowIndex: number,
  ) => {
    const formattedData = Object.entries(rowData)
      .map(([key, value]) => `${key}: ${value}`)
      .join("\n");

    const rowText = `\n\n--- Rekord #${rowIndex + 1} ---\n${formattedData}\n--- Koniec rekordu ---\n`;

    setEmailForm((prev) => ({
      ...prev,
      message: prev.message + rowText,
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl text-black font-semibold mb-4">Email Manager</h2>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("send")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "send"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Wyślij Email
          </button>
          <button
            onClick={() => setActiveTab("contacts")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "contacts"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Kontakty ({contacts.length})
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "history"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Historia ({emailHistory.length})
          </button>
        </nav>
      </div>

      {/* Send Email Tab */}
      {activeTab === "send" && (
        <div>
          <form onSubmit={handleSendEmail} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Odbiorcy
              </label>

              {/* Lista dodanych odbiorców */}
              {emailForm.to.length > 0 && (
                <div className="mb-3 p-3 bg-gray-50 rounded border">
                  <div className="text-sm text-gray-600 mb-2">
                    Dodani odbiorcy ({emailForm.to.length}):
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {emailForm.to.map((email, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                      >
                        {email}
                        <button
                          type="button"
                          onClick={() => removeEmailRecipient(email)}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                          title="Usuń odbiorcę"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Pole dodawania nowego odbiorcy */}
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={currentEmail}
                    onChange={(e) => setCurrentEmail(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addEmailRecipient();
                      }
                    }}
                    className="flex-1 border border-gray-300 rounded px-3 py-2 text-black"
                    placeholder="email@example.com"
                  />
                  <button
                    type="button"
                    onClick={addEmailRecipient}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm"
                  >
                    Dodaj
                  </button>
                </div>

                {/* Sekcja wybierania z kontaktów */}
                <div className="space-y-2">
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="flex-1 border border-gray-300 rounded px-3 py-2 text-black text-sm"
                      placeholder="Wyszukaj kontakty..."
                    />
                    {searchTerm && (
                      <button
                        type="button"
                        onClick={() => setSearchTerm("")}
                        className="text-gray-500 hover:text-gray-700 text-sm px-2"
                        title="Wyczyść wyszukiwanie"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <select
                    value=""
                    onChange={(e) => {
                      const contact = filteredContacts.find(
                        (c) => c._id === e.target.value,
                      );
                      if (contact) selectContact(contact);
                    }}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-black"
                    disabled={filteredContacts.length === 0}
                  >
                    <option value="">
                      {filteredContacts.length === 0
                        ? searchTerm
                          ? "Brak pasujących kontaktów"
                          : "Brak kontaktów"
                        : `Wybierz z kontaktów (${filteredContacts.length})`}
                    </option>
                    {filteredContacts.map((contact) => (
                      <option key={contact._id} value={contact._id}>
                        {contact.name} ({contact.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Temat
              </label>
              <input
                type="text"
                value={emailForm.subject}
                onChange={(e) =>
                  setEmailForm((prev) => ({ ...prev, subject: e.target.value }))
                }
                className="w-full border border-gray-300 rounded px-3 py-2 text-black"
                placeholder="Temat wiadomości"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Wiadomość
              </label>
              <textarea
                value={emailForm.message}
                onChange={(e) =>
                  setEmailForm((prev) => ({ ...prev, message: e.target.value }))
                }
                className="w-full border border-gray-300 rounded px-3 py-2 text-black h-32"
                placeholder="Treść wiadomości..."
                required
              />
            </div>

            {data && data.length > 0 && (
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="attachData"
                  checked={emailForm.attachData}
                  onChange={(e) =>
                    setEmailForm((prev) => ({
                      ...prev,
                      attachData: e.target.checked,
                    }))
                  }
                  className="mr-2"
                />
                <label htmlFor="attachData" className="text-sm text-gray-700">
                  Załącz dane CSV ({data.length} rekordów)
                </label>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-6 py-2 rounded"
            >
              {loading ? "Wysyłanie..." : "Wyślij Email"}
            </button>
          </form>
        </div>
      )}

      {/* Contacts Tab */}
      {activeTab === "contacts" && (
        <div className="space-y-6">
          {/* Add Contact Form */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Dodaj Nowy Kontakt
            </h3>
            <form onSubmit={handleAddContact} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nazwa
                  </label>
                  <input
                    type="text"
                    value={contactForm.name}
                    onChange={(e) =>
                      setContactForm((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    className="w-full border border-gray-300 rounded px-3 py-2 text-black"
                    placeholder="Jan Kowalski"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={contactForm.email}
                    onChange={(e) =>
                      setContactForm((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    className="w-full border border-gray-300 rounded px-3 py-2 text-black"
                    placeholder="jan@example.com"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Opis (opcjonalny)
                </label>
                <input
                  type="text"
                  value={contactForm.description}
                  onChange={(e) =>
                    setContactForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className="w-full border border-gray-300 rounded px-3 py-2 text-black"
                  placeholder="Manager, Dział logistyki..."
                />
              </div>
              <div className="flex justify-between items-center mb-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white px-6 py-2 rounded"
                >
                  {loading ? "Dodawanie..." : "Dodaj Kontakt"}
                </button>
                <button
                  type="button"
                  onClick={handleAddTestContacts}
                  disabled={loading}
                  className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded text-sm"
                >
                  Dodaj testowe kontakty
                </button>
              </div>
            </form>
          </div>

          {/* Contacts List */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Lista Kontaktów
              </h3>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-2 text-black text-sm"
                  placeholder="Szukaj kontaktów..."
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="text-gray-500 hover:text-gray-700 text-sm"
                    title="Wyczyść wyszukiwanie"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {searchTerm && (
              <div className="mb-3 text-sm text-gray-600">
                Znaleziono: {filteredContacts.length} z {contacts.length}{" "}
                kontaktów
              </div>
            )}

            {filteredContacts.length === 0 ? (
              <p className="text-gray-500">
                {searchTerm
                  ? "Brak kontaktów pasujących do wyszukiwania"
                  : "Brak kontaktów"}
              </p>
            ) : (
              <div className="space-y-2">
                {filteredContacts.map((contact) => (
                  <div
                    key={contact._id}
                    className="flex items-center justify-between p-3 border rounded"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {contact.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        {contact.email}
                      </div>
                      {contact.description && (
                        <div className="text-sm text-gray-500">
                          {contact.description}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => selectContact(contact)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                      >
                        Wybierz
                      </button>
                      <button
                        onClick={() => handleDeleteContact(contact._id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                      >
                        Usuń
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === "history" && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Historia Emaili
            </h3>
            <button
              onClick={loadEmailHistory}
              className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
            >
              Odśwież
            </button>
          </div>
          {emailHistory.length === 0 ? (
            <p className="text-gray-500">Brak historii emaili</p>
          ) : (
            <div className="space-y-3">
              {emailHistory.map((email) => (
                <div
                  key={email._id}
                  className={`p-4 border rounded ${
                    email.status === "sent"
                      ? "border-green-200 bg-green-50"
                      : "border-red-200 bg-red-50"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        Do: {email.to}
                      </div>
                      <div className="text-sm text-gray-600">
                        Temat: {email.subject}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {new Date(email.sentAt).toLocaleString("pl-PL")}
                      </div>
                      {email.attachmentInfo && (
                        <div className="text-sm text-blue-600 mt-1">
                          📎 {email.attachmentInfo}
                        </div>
                      )}
                    </div>
                    <div
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        email.status === "sent"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {email.status === "sent" ? "Wysłany" : "Błąd"}
                    </div>
                  </div>
                  {email.error && (
                    <div className="mt-2 text-sm text-red-600">
                      Błąd: {email.error}
                    </div>
                  )}
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                      Pokaż wiadomość
                    </summary>
                    <div className="mt-1 p-2 bg-gray-100 rounded text-sm text-gray-700">
                      {email.message}
                    </div>
                  </details>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
