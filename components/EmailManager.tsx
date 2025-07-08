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
    to: [] as string[], // Change to array for multiple recipients
    subject: "",
    message: "",
    attachData: false,
  });

  const [currentEmail, setCurrentEmail] = useState(""); // Field for entering new email
  const [searchTerm, setSearchTerm] = useState(""); // Field for searching contacts

  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    description: "",
  });

  // Load contacts on start
  useEffect(() => {
    loadContacts();
    loadEmailHistory();
  }, []);

  // Pass reference to functions to parent component
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
      console.error("Error loading contacts:", error);
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
      console.error("Error loading history:", error);
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();

    if (emailForm.to.length === 0) {
      alert("Add at least one recipient");
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
        alert("Email has been sent!");
        setEmailForm({ to: [], subject: "", message: "", attachData: false });
        setCurrentEmail("");
        loadEmailHistory(); // Refresh history
      } else {
        alert(`Error: ${json.error}`);
      }
    } catch (error) {
      console.error("Error sending email:", error);
      alert("Error sending email");
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
        alert("Contact has been added!");
        setContactForm({ name: "", email: "", description: "" });
        loadContacts(); // Refresh contacts list
      } else {
        alert(`Error: ${json.error}`);
      }
    } catch (error) {
      console.error("Error adding contact:", error);
      alert("Error adding contact");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!confirm("Are you sure you want to delete this contact?")) return;

    try {
      const res = await fetch(`/api/contacts?id=${contactId}`, {
        method: "DELETE",
      });

      const json = await res.json();

      if (json.success) {
        alert("Contact has been deleted!");
        loadContacts(); // Refresh contacts list
      } else {
        alert(`Error: ${json.error}`);
      }
    } catch (error) {
      console.error("Error deleting contact:", error);
      alert("Error deleting contact");
    }
  };

  const handleAddTestContacts = async () => {
    if (!confirm("Do you want to add 5 test contacts?")) return;

    setLoading(true);
    try {
      const res = await fetch("/api/add-test-contacts", {
        method: "POST",
      });

      const json = await res.json();

      if (json.success) {
        const { results } = json;
        let message = "Operation completed!\n\n";

        if (results.added.length > 0) {
          message += `✅ Added (${
            results.added.length
          }):\n${results.added.join("\n")}\n\n`;
        }

        if (results.existing.length > 0) {
          message += `ℹ️ Already existed (${
            results.existing.length
          }):\n${results.existing.join("\n")}\n\n`;
        }

        if (results.errors.length > 0) {
          message += `❌ Errors (${
            results.errors.length
          }):\n${results.errors.join("\n")}\n\n`;
        }

        message += `📊 Total contacts in database: ${json.totalContacts}`;

        alert(message);
        loadContacts(); // Refresh contacts list
      } else {
        alert(`Error: ${json.error}`);
      }
    } catch (error) {
      console.error("Error adding test contacts:", error);
      alert("Error adding test contacts");
    } finally {
      setLoading(false);
    }
  };

  const selectContact = (contact: Contact) => {
    // Add contact to recipients list if it doesn't exist yet
    setEmailForm((prev) => ({
      ...prev,
      to: prev.to.includes(contact.email)
        ? prev.to
        : [...prev.to, contact.email],
    }));
    setActiveTab("send");
  };

  // Functions for managing recipients
  const addEmailRecipient = () => {
    if (!currentEmail.trim()) return;

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(currentEmail)) {
      alert("Invalid email format");
      return;
    }

    // Check if email doesn't already exist
    if (emailForm.to.includes(currentEmail)) {
      alert("This email address has already been added");
      return;
    }

    // Add email to list
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

  // Contact filtering function
  const filteredContacts = contacts.filter((contact) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      contact.name.toLowerCase().includes(searchLower) ||
      contact.email.toLowerCase().includes(searchLower) ||
      contact.description?.toLowerCase().includes(searchLower)
    );
  });

  // Function to add column data to message
  const addColumnDataToMessage = (columnName: string, columnData: string[]) => {
    const columnText = `\n\n--- Data from column "${columnName}" ---\n${columnData.join("\n")}\n--- End of data ---\n`;

    setEmailForm((prev) => ({
      ...prev,
      message: prev.message + columnText,
    }));
  };

  // Function to add row data to message
  const addRowDataToMessage = (
    rowData: Record<string, unknown>,
    rowIndex: number,
  ) => {
    const formattedData = Object.entries(rowData)
      .map(([key, value]) => `${key}: ${value}`)
      .join("\n");

    const rowText = `\n\n--- Record #${rowIndex + 1} ---\n${formattedData}\n--- End of record ---\n`;

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
            Send Email
          </button>
          <button
            onClick={() => setActiveTab("contacts")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "contacts"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Contacts ({contacts.length})
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "history"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            History ({emailHistory.length})
          </button>
        </nav>
      </div>

      {/* Send Email Tab */}
      {activeTab === "send" && (
        <div>
          <form onSubmit={handleSendEmail} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recipients
              </label>

              {/* List of added recipients */}
              {emailForm.to.length > 0 && (
                <div className="mb-3 p-3 bg-gray-50 rounded border">
                  <div className="text-sm text-gray-600 mb-2">
                    Added recipients ({emailForm.to.length}):
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
                          title="Remove recipient"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Field for adding new recipient */}
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
                    Add
                  </button>
                </div>

                {/* Section for selecting from contacts */}
                <div className="space-y-2">
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="flex-1 border border-gray-300 rounded px-3 py-2 text-black text-sm"
                      placeholder="Search contacts..."
                    />
                    {searchTerm && (
                      <button
                        type="button"
                        onClick={() => setSearchTerm("")}
                        className="text-gray-500 hover:text-gray-700 text-sm px-2"
                        title="Clear search"
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
                          ? "No matching contacts"
                          : "No contacts"
                        : `Select from contacts (${filteredContacts.length})`}
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
                Subject
              </label>
              <input
                type="text"
                value={emailForm.subject}
                onChange={(e) =>
                  setEmailForm((prev) => ({ ...prev, subject: e.target.value }))
                }
                className="w-full border border-gray-300 rounded px-3 py-2 text-black"
                placeholder="Message subject"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message
              </label>
              <textarea
                value={emailForm.message}
                onChange={(e) =>
                  setEmailForm((prev) => ({ ...prev, message: e.target.value }))
                }
                className="w-full border border-gray-300 rounded px-3 py-2 text-black h-32"
                placeholder="Message content..."
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
                  Attach CSV data ({data.length} records)
                </label>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-6 py-2 rounded"
            >
              {loading ? "Sending..." : "Send Email"}
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
              Add New Contact
            </h3>
            <form onSubmit={handleAddContact} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name
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
                    placeholder="John Doe"
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
                    placeholder="john@example.com"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (optional)
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
                  placeholder="Manager, Logistics Department..."
                />
              </div>
              <div className="flex justify-between items-center mb-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white px-6 py-2 rounded"
                >
                  {loading ? "Adding..." : "Add Contact"}
                </button>
                <button
                  type="button"
                  onClick={handleAddTestContacts}
                  disabled={loading}
                  className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded text-sm"
                >
                  Add test contacts
                </button>
              </div>
            </form>
          </div>

          {/* Contacts List */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Contacts List
              </h3>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-2 text-black text-sm"
                  placeholder="Search contacts..."
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="text-gray-500 hover:text-gray-700 text-sm"
                    title="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {searchTerm && (
              <div className="mb-3 text-sm text-gray-600">
                Found: {filteredContacts.length} of {contacts.length} contacts
              </div>
            )}

            {filteredContacts.length === 0 ? (
              <p className="text-gray-500">
                {searchTerm ? "No contacts matching the search" : "No contacts"}
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
                        Select
                      </button>
                      <button
                        onClick={() => handleDeleteContact(contact._id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                      >
                        Delete
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
            <h3 className="text-lg font-medium text-gray-900">Email History</h3>
            <button
              onClick={loadEmailHistory}
              className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
            >
              Refresh
            </button>
          </div>
          {emailHistory.length === 0 ? (
            <p className="text-gray-500">No email history</p>
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
                        To: {email.to}
                      </div>
                      <div className="text-sm text-gray-600">
                        Subject: {email.subject}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {new Date(email.sentAt).toLocaleString("en-US")}
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
                      {email.status === "sent" ? "Sent" : "Error"}
                    </div>
                  </div>
                  {email.error && (
                    <div className="mt-2 text-sm text-red-600">
                      Error: {email.error}
                    </div>
                  )}
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                      Show message
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
