function splitCsvLine(line) {
  const cells = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      const next = line[i + 1];
      if (inQuotes && next === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      cells.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current);
  return cells.map((c) => c.trim());
}

export function parseBulkJson(text) {
  const parsed = JSON.parse(text);
  if (Array.isArray(parsed)) return parsed;
  if (parsed && Array.isArray(parsed.items)) return parsed.items;
  if (parsed && Array.isArray(parsed.data)) return parsed.data;
  throw new Error('Invalid JSON: expected an array or { "items": [...] } / { "data": [...] }');
}

export function parseVideosCsv(text) {
  const lines = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) throw new Error("CSV must have a header row and at least 1 data row");

  const header = splitCsvLine(lines[0]).map((h) => h.trim());
  const rows = lines.slice(1);

  const normalizeKey = (k) => k.replace(/\s+/g, "").toLowerCase();
  const keyMap = new Map(header.map((h, idx) => [normalizeKey(h), idx]));

  const required = ["videotitle", "thumbnail", "videourl", "duration", "category"];
  for (const reqKey of required) {
    if (!keyMap.has(reqKey)) throw new Error(`CSV missing required column: ${reqKey}`);
  }

  return rows.map((line, rowIndex) => {
    const cells = splitCsvLine(line);
    const get = (key) => cells[keyMap.get(key)] ?? "";

    const isPublishedRaw = get("ispublished");
    const viewsRaw = get("views");

    const isPublished =
      isPublishedRaw === ""
        ? true
        : ["true", "1", "yes", "y"].includes(String(isPublishedRaw).toLowerCase());

    const views = viewsRaw === "" ? 0 : Number(viewsRaw);
    if (Number.isNaN(views)) throw new Error(`Invalid views value at row ${rowIndex + 2}`);

    return {
      videoTitle: get("videotitle"),
      thumbnail: get("thumbnail"),
      videoUrl: get("videourl"),
      duration: get("duration"),
      category: get("category"),
      description: get("description") || "",
      isPublished,
      views,
    };
  });
}

