import { NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_BYTES = 8 * 1024 * 1024;
const MAX_TEXT_CHARS = 25_000;

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { error: { code: "bad_request", message: "Expected multipart form data." } },
      { status: 400 }
    );
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: { code: "bad_request", message: "No file uploaded." } },
      { status: 400 }
    );
  }
  if (file.size === 0) {
    return NextResponse.json(
      { error: { code: "bad_request", message: "Empty file." } },
      { status: 400 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      {
        error: {
          code: "file_too_large",
          message: `File too large (max ${(MAX_BYTES / 1024 / 1024).toFixed(0)}MB).`,
        },
      },
      { status: 413 }
    );
  }

  const looksPdf =
    file.type === "application/pdf" ||
    file.name.toLowerCase().endsWith(".pdf");
  if (!looksPdf) {
    return NextResponse.json(
      { error: { code: "bad_request", message: "Only PDF files are supported." } },
      { status: 400 }
    );
  }

  try {
    const buf = new Uint8Array(await file.arrayBuffer());
    const parser = new PDFParse({ data: buf });
    const result = await parser.getText();
    await parser.destroy();
    const text = result.text.trim().slice(0, MAX_TEXT_CHARS);
    if (text.length < 30) {
      return NextResponse.json(
        {
          error: {
            code: "empty_pdf",
            message: "Couldn't extract text from this PDF (maybe scanned/image-only).",
          },
        },
        { status: 422 }
      );
    }
    return NextResponse.json({ text });
  } catch (err) {
    return NextResponse.json(
      {
        error: {
          code: "pdf_parse_failed",
          message:
            err instanceof Error ? err.message : "Failed to parse the PDF.",
        },
      },
      { status: 500 }
    );
  }
}
