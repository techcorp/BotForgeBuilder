import formidable from "formidable";
import fs from "fs";

export const config = {
  api: { bodyParser: false },
};

// pdf2json — pure Node.js, no worker, no canvas needed
function parsePDF(filePath) {
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const PDFParser = require("pdf2json");
    const parser = new PDFParser(null, 1); // 1 = raw text mode

    parser.on("pdfParser_dataError", (err) => reject(new Error(err.parserError || "PDF parse error")));

    parser.on("pdfParser_dataReady", () => {
      try {
        const raw = parser.getRawTextContent();
        // getRawTextContent adds page breaks — clean them up
        const text = raw
          .replace(/\r\n/g, "\n")
          .replace(/----------------Page \(\d+\) Break----------------/g, "\n")
          .replace(/\n{3,}/g, "\n\n")
          .trim();
        resolve({ text, pages: parser.data?.Pages?.length || 0 });
      } catch (e) {
        reject(e);
      }
    });

    parser.loadPDF(filePath);
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const form = formidable({ maxFileSize: 10 * 1024 * 1024 });
  let files;
  try {
    [, files] = await form.parse(req);
  } catch (err) {
    return res.status(400).json({ error: "File upload failed: " + err.message });
  }

  const file = Array.isArray(files.pdf) ? files.pdf[0] : files.pdf;
  if (!file) return res.status(400).json({ error: "No PDF file received" });

  try {
    const { text, pages } = await parsePDF(file.filepath);

    try { fs.unlinkSync(file.filepath); } catch {}

    if (!text || text.length < 30) {
      return res.status(400).json({
        error: "PDF appears empty or is scanned (image-only). Please use a text-based PDF.",
      });
    }

    return res.json({
      success:   true,
      text:      text.slice(0, 15000), // max 15k chars for context
      charCount: text.length,
      pages,
    });

  } catch (err) {
    try { fs.unlinkSync(file.filepath); } catch {}
    return res.status(500).json({ error: "PDF parsing failed: " + err.message });
  }
}
