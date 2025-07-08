"use client";

import EmailManager from "@/components/EmailManager";
import { useEffect, useMemo, useState } from "react";

export default function Home() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedField, setSelectedField] = useState<string>("all");
  const [databaseStats, setDatabaseStats] = useState<any>(null);
  const [loadingFromDB, setLoadingFromDB] = useState(false);

  // Referencja do EmailManager
  const [emailManagerRef, setEmailManagerRef] = useState<{
    addColumnDataToMessage: (columnName: string, columnData: string[]) => void;
    addRowDataToMessage: (
      rowData: Record<string, unknown>,
      rowIndex: number,
    ) => void;
  } | null>(null);

  // Pobierz nazwy kolumn z danych
  const fieldNames = useMemo(() => {
    if (!data || data.length === 0) return [];
    // Filtruj metadata
    const firstRecord = data[0];
    if (firstRecord._metadata) {
      const { _, ...actualData } = firstRecord;
      return Object.keys(actualData);
    }
    return Object.keys(firstRecord);
  }, [data]);

  // Funkcja filtrująca dane na podstawie wyszukiwania
  const filteredData = useMemo(() => {
    if (!data || !searchTerm) return data;

    return data.filter((row) => {
      const { _, ...searchableData } = row;

      if (selectedField === "all") {
        // Przeszukaj wszystkie wartości w wierszu
        return Object.values(searchableData).some((value) =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase()),
        );
      } else {
        // Przeszukaj tylko wybrane pole
        const fieldValue = searchableData[selectedField];
        return String(fieldValue)
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      }
    });
  }, [data, searchTerm, selectedField]);

  // Funkcja do ładowania danych z bazy danych
  const loadFromDatabase = async () => {
    setLoadingFromDB(true);
    try {
      console.log("📥 Ładuję dane z bazy...");
      const res = await fetch("/api/database");
      const json = await res.json();

      if (json.success) {
        setData(json.data);
        setFileName(`Database Records (${json.count} records)`);
        setSearchTerm(""); // Wyczyść wyszukiwanie
        setSelectedField("all"); // Resetuj pole
        console.log("✅ Załadowano z bazy:", json.count, "rekordów");
      } else {
        console.error("❌ Błąd ładowania z bazy:", json.error);
        alert(`Błąd ładowania z bazy: ${json.error}`);
      }
    } catch (error) {
      console.error("❌ Błąd ładowania z bazy:", error);
      alert("Błąd ładowania danych z bazy");
    } finally {
      setLoadingFromDB(false);
    }
  };

  // Funkcja do ładowania statystyk
  const loadDatabaseStats = async () => {
    try {
      const res = await fetch("/api/database?stats=true");
      const stats = await res.json();
      setDatabaseStats(stats);
      console.log("📊 Statystyki bazy:", stats);
    } catch (error) {
      console.error("❌ Błąd ładowania statystyk:", error);
    }
  };

  // AUTOMATYCZNE ŁADOWANIE PRZY STARCIE STRONY
  useEffect(() => {
    console.log("🚀 Strona załadowana - ładuję dane...");

    // Załaduj statystyki
    loadDatabaseStats();

    // Automatycznie załaduj dane z bazy
    loadFromDatabase();
  }, []); // Puste dependency array = uruchom tylko raz przy starcie

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const form = e.currentTarget;
    const fileInput = form.elements.namedItem("file") as HTMLInputElement;

    if (!fileInput.files?.[0]) {
      setLoading(false);
      alert("Wybierz plik CSV");
      return;
    }

    const file = fileInput.files[0];

    // Sprawdź czy to plik CSV
    if (!file.name.endsWith(".csv")) {
      setLoading(false);
      alert("Wybierz plik CSV");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    setFileName(file.name);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (json.success) {
        setData(json.data);
        setSearchTerm(""); // Wyczyść wyszukiwanie po załadowaniu nowego pliku
        setSelectedField("all"); // Resetuj wybór pola

        // Wyświetl dane w konsoli przeglądarki
        console.log("=== DANE CSV W KONSOLI PRZEGLĄDARKI ===");
        console.log("Nazwa pliku:", json.filename);
        console.log("Liczba rekordów:", json.recordCount);
        console.log("Dostępne pola:", Object.keys(json.data[0] || {}));
        console.log("JSON:");
        console.log(JSON.stringify(json.data, null, 2));
        console.log("=== KONIEC DANYCH CSV ===");

        // Informacje o bazie danych
        if (json.database) {
          console.log("=== INFORMACJE O BAZIE DANYCH ===");
          console.log("Nowe rekordy:", json.database.saved);
          console.log("Duplikaty:", json.database.duplicates);
          console.log("Łącznie:", json.database.total);
          console.log("=== KONIEC INFORMACJI O BAZIE ===");

          alert(
            `Plik ${json.filename} został przetworzony!\n` +
              `Nowe rekordy: ${json.database.saved}\n` +
              `Duplikaty: ${json.database.duplicates}\n` +
              `Sprawdź konsolę przeglądarki (F12)`,
          );
        } else {
          alert(
            `Plik ${json.filename} został przetworzony! Sprawdź konsolę przeglądarki (F12)`,
          );
        }

        // Odśwież statystyki po uploadzie
        loadDatabaseStats();
      } else {
        alert(`Błąd: ${json.error}`);
      }
    } catch (error) {
      console.error("Błąd podczas przesyłania pliku:", error);
      alert("Błąd podczas przesyłania pliku");
    } finally {
      setLoading(false);
    }
  };

  // Funkcja do wyczyścenia wyszukiwania
  const clearSearch = () => {
    setSearchTerm("");
    setSelectedField("all");
  };

  // Funkcja do dodania elementu do emaila
  const addItemToEmail = (item: Record<string, unknown>) => {
    // Usuń metadata z elementu

    const { _metadata, ...cleanItem } = item;

    // Sformatuj dane jako tekst
    const itemText = Object.entries(cleanItem)
      .map(([key, value]) => `${key}: ${value}`)
      .join("\n");

    // Dodaj do localStorage tymczasowo lub użyj innego sposobu
    // Na razie pokażemy alert z danymi
    const message = `--- Element z danych ---\n${itemText}`;

    // Możemy też skopiować do schowka
    navigator.clipboard
      .writeText(message)
      .then(() => {
        alert(
          "Dane elementu zostały skopiowane do schowka! Możesz je wkleić w Email Manager.",
        );
      })
      .catch(() => {
        alert(`Dane elementu:\n\n${message}`);
      });
  };

  // Funkcja do dodania wiersza do wiadomości email
  const addRowToEmail = (row: Record<string, unknown>, index: number) => {
    if (!emailManagerRef || !filteredData) {
      alert("Email Manager nie jest gotowy lub brak danych");
      return;
    }

    // Usuń metadata z wiersza
    const { _metadata, ...cleanData } = row;

    // Dodaj dane wiersza do wiadomości email
    emailManagerRef.addRowDataToMessage(cleanData, index);

    alert(`Dodano rekord #${index + 1} do wiadomości email!`);
  };

  return (
    <div className="mx-auto p-8 w-full">
      <h1 className="text-3xl font-bold mb-8">CSV Reader with Database</h1>

      {/* Statystyki bazy danych */}
      {databaseStats && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-green-800 mb-2">
            Database Statistics:
          </h3>
          <div className="text-green-700 space-y-1">
            <p>Total files: {databaseStats.totalFiles}</p>
            <p>Total records: {databaseStats.totalRecords}</p>
            {databaseStats.latestFile && (
              <p>
                Latest file: {databaseStats.latestFile.filename} (
                {new Date(
                  databaseStats.latestFile.uploadDate,
                ).toLocaleDateString()}
                )
              </p>
            )}
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={loadFromDatabase}
              disabled={loadingFromDB}
              className="bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white px-4 py-2 rounded text-sm"
            >
              {loadingFromDB ? "Loading..." : "Reload from Database"}
            </button>
            <button
              onClick={loadDatabaseStats}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm"
            >
              Refresh Stats
            </button>
          </div>
        </div>
      )}

      {/* Formularz uploadu */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl text-black font-semibold mb-4">
          Upload New CSV
        </h2>
        <form onSubmit={handleUpload} className="space-y-4 text-black">
          <div>
            <input
              type="file"
              name="file"
              accept=".csv"
              required
              className="border border-gray-300 rounded px-3 py-2 w-full"
            />
            <p className="text-sm text-black mt-1">Only CSV (.csv)</p>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-6 py-2 rounded"
          >
            {loading ? "Loading..." : "Send CSV file"}
          </button>
        </form>
      </div>

      {/* Instrukcje */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-yellow-800 mb-2">Instructions:</h3>
        <ol className="list-decimal list-inside text-yellow-700 space-y-1">
          <li>Data from database loads automatically when page opens</li>
          <li>Upload new CSV files to add more data</li>
          <li>All data is permanently saved in MongoDB</li>
          <li>Use search to filter data</li>
          <li>Duplicate records are automatically prevented</li>
          <li>
            <strong>
              Click on any row to add entire record to email message
            </strong>
          </li>
          <li>Click on 📋 button to copy single record to clipboard</li>
        </ol>
      </div>

      {/* Email Manager */}
      <EmailManager data={data || undefined} onRef={setEmailManagerRef} />

      {/* Panel wyszukiwania */}
      {data && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg text-black font-semibold mb-4">Search Data</h3>

          {/* Wybór pola do wyszukiwania */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search in field:
            </label>
            <select
              value={selectedField}
              onChange={(e) => setSelectedField(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 w-full md:w-auto text-black"
            >
              <option value="all">All fields</option>
              {fieldNames.map((field) => (
                <option key={field} value={field}>
                  {field}
                </option>
              ))}
            </select>
          </div>

          {/* Pole wyszukiwania */}
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <input
                type="text"
                placeholder={
                  selectedField === "all"
                    ? "Search in all columns..."
                    : `Search in "${selectedField}"...`
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 w-full text-black"
              />
            </div>
            <button
              onClick={clearSearch}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
            >
              Clear
            </button>
          </div>

          {/* Informacje o wynikach */}
          <div className="mt-2 text-sm text-gray-600">
            {searchTerm && (
              <p>
                Found {filteredData?.length || 0} records matching {searchTerm}
                {selectedField !== "all" && ` in field "${selectedField}"`}
              </p>
            )}
            {fieldNames.length > 0 && (
              <p className="mt-1">Available fields: {fieldNames.join(", ")}</p>
            )}
          </div>
        </div>
      )}

      {/* Wyniki na stronie */}
      {data && (
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
          <h2 className="text-lg md:text-xl text-black font-semibold mb-4">
            Data preview: {fileName}
          </h2>
          <p className="text-gray-600 mb-4">
            {searchTerm
              ? `Showing ${Math.min(filteredData?.length || 0, 500)} of ${
                  filteredData?.length || 0
                } filtered records (max 500 displayed)`
              : `Total records: ${data.length} (showing max 500)`}
          </p>

          {/* Tabela z danymi */}
          {filteredData && filteredData.length > 0 && (
            <div className="w-full">
              {/* Informacja o przewijaniu na małych ekranach */}
              <div className="text-xs text-gray-500 mb-2 md:hidden">
                💡 Przesuń tabelę w prawo aby zobaczyć więcej kolumn
              </div>
              <div className="overflow-x-auto overflow-y-auto max-h-80 border text-black border-gray-200 rounded text-sm">
                <table className="w-full border-collapse min-w-max">
                  <thead className="sticky top-0 bg-white z-10">
                    <tr className="bg-gray-50">
                      {fieldNames.map((key) => (
                        <th
                          key={key}
                          className={`border border-gray-200 px-2 py-1 text-left text-xs font-medium min-w-24 max-w-32 ${
                            selectedField === key ? "bg-blue-100" : ""
                          }`}
                        >
                          <div className="truncate">
                            {key}
                            {selectedField === key && (
                              <span className="ml-1 text-blue-600">🔍</span>
                            )}
                          </div>
                        </th>
                      ))}
                      <th className="border border-gray-200 px-2 py-1 text-center w-16 text-xs font-medium sticky right-0 bg-gray-50">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.slice(0, 500).map((row, index) => {
                      const { _metadata, ...displayData } = row;
                      return (
                        <tr
                          key={index}
                          className="hover:bg-blue-50 cursor-pointer transition-colors"
                          onClick={() => addRowToEmail(row, index)}
                          title={`Kliknij aby dodać rekord #${index + 1} do wiadomości email`}
                        >
                          {Object.entries(displayData).map(
                            ([key, value], cellIndex) => (
                              <td
                                key={cellIndex}
                                className={`border text-black border-gray-200 px-2 py-1 text-xs min-w-24 max-w-32 ${
                                  selectedField === key ? "bg-blue-50" : ""
                                }`}
                              >
                                <div className="truncate" title={String(value)}>
                                  {/* Podświetl wyszukiwany tekst */}
                                  {searchTerm &&
                                  String(value)
                                    .toLowerCase()
                                    .includes(searchTerm.toLowerCase()) &&
                                  (selectedField === "all" ||
                                    selectedField === key) ? (
                                    <span
                                      dangerouslySetInnerHTML={{
                                        __html: String(value).replace(
                                          new RegExp(`(${searchTerm})`, "gi"),
                                          '<mark class="bg-yellow-200">$1</mark>',
                                        ),
                                      }}
                                    />
                                  ) : (
                                    String(value)
                                  )}
                                </div>
                              </td>
                            ),
                          )}
                          <td className="border border-gray-200 px-1 py-1 text-center sticky right-0 bg-white">
                            <button
                              onClick={(e) => {
                                e.stopPropagation(); // Zatrzymaj propagację kliknięcia
                                addItemToEmail(row);
                              }}
                              className="bg-gray-500 hover:bg-gray-600 text-white px-1 py-1 rounded text-xs w-8 h-6"
                              title="Kopiuj do schowka"
                            >
                              �
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Komunikat gdy brak wyników */}
          {filteredData && filteredData.length === 0 && searchTerm && (
            <div className="text-center py-8">
              <p className="text-gray-500">
                No results found for &quot;{searchTerm}&quot;
                {selectedField !== "all" && ` in field "${selectedField}"`}
              </p>
              <button
                onClick={clearSearch}
                className="mt-2 text-blue-500 hover:text-blue-700 underline"
              >
                Clear search
              </button>
            </div>
          )}

          {/* JSON w kodzie */}
          <details className="mt-4">
            <summary className="cursor-pointer font-medium text-gray-700 hover:text-gray-900">
              Show JSON{" "}
              {searchTerm && `(${filteredData?.length || 0} filtered records)`}
            </summary>
            <pre className="mt-2 p-4 bg-gray-100 rounded text-sm text-black overflow-auto max-h-64">
              {JSON.stringify(filteredData || data, null, 2)}
            </pre>
          </details>
        </div>
      )}

      {/* Komunikat gdy brak danych */}
      {!data && !loadingFromDB && (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">
            No data available. Upload a CSV file or check database connection.
          </p>
          <button
            onClick={loadFromDatabase}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded"
          >
            Try Loading from Database
          </button>
        </div>
      )}

      {/* Loading indicator */}
      {loadingFromDB && (
        <div className="text-center py-8">
          <p className="text-gray-500">Loading data from database...</p>
        </div>
      )}
    </div>
  );
}
