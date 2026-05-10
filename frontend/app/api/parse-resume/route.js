import PDFParser from "pdf2json";
import mammoth from "mammoth";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("resume");

    if (!file) {
      return Response.json({ error: "No file uploaded" }, { status: 400 });
    }

    const fileName = file.name.toLowerCase();
    const buffer = Buffer.from(await file.arrayBuffer());
    let extractedText = "";

    if (fileName.endsWith(".pdf")) {
      extractedText = await new Promise((resolve, reject) => {
        const pdfParser = new PDFParser(null, 1);
        pdfParser.on("pdfParser_dataError", errData => reject(errData.parserError));
        pdfParser.on("pdfParser_dataReady", () => {
          resolve(pdfParser.getRawTextContent().replace(/\r\n/g, "\n"));
        });
        pdfParser.parseBuffer(buffer);
      });
    } else if (fileName.endsWith(".docx")) {
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value;
    } else if (fileName.endsWith(".txt") || fileName.endsWith(".md")) {
      extractedText = buffer.toString("utf-8");
    } else {
      return Response.json(
        { error: "Unsupported file type. Please upload PDF, DOCX, TXT, or MD." },
        { status: 400 }
      );
    }

    // Clean up extracted text
    extractedText = extractedText
      .replace(/\r\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    if (!extractedText || extractedText.length < 20) {
      return Response.json(
        { error: "Could not extract enough text from the file. Please try a different file." },
        { status: 400 }
      );
    }

    return Response.json({
      text: extractedText,
      fileName: file.name,
      fileSize: file.size,
      charCount: extractedText.length,
    });
  } catch (error) {
    console.error("Resume parse error:", error);
    return Response.json(
      { error: "Failed to parse resume: " + error.message },
      { status: 500 }
    );
  }
}
