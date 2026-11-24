/**
 * Helper utilitas untuk sanitasi, pembuatan, dan parsing CSV yang aman
 */

export function sanitizeCsvValue(val: string | number | boolean | null | undefined): string {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  const escaped = str.replace(/"/g, '""');
  // Cegah CSV / Formula Injection jika nilai diawali dengan =, +, -, @, tab, return
  if (/^[=+\-@\t\r]/.test(escaped)) {
    return `"'${escaped}"`;
  }
  return `"${escaped}"`;
}

export function toCsvString(headers: string[], rows: (string | number | boolean)[][]): string {
  const headerLine = headers.map((h) => sanitizeCsvValue(h)).join(",");
  const rowLines = rows.map((row) => row.map((cell) => sanitizeCsvValue(cell)).join(","));
  return [headerLine, ...rowLines].join("\r\n");
}

/**
 * Parser CSV standar RFC 4180 yang menangani quoted cells, koma di dalam tanda kutip, dan baris baru
 */
export function parseCsvString(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = "";
  let inQuotes = false;

  const text = csvText.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote: "" -> "
          currentCell += '"';
          i++;
        } else {
          // End of quoted cell
          inQuotes = false;
        }
      } else {
        currentCell += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        currentRow.push(currentCell.trim());
        currentCell = "";
      } else if (char === "\n") {
        currentRow.push(currentCell.trim());
        // Hanya masukkan baris jika tidak seluruhnya kosong
        if (currentRow.some((c) => c.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentCell = "";
      } else {
        currentCell += char;
      }
    }
  }

  // Tambahkan sel terakhir jika ada
  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some((c) => c.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}
