import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 30;

const requestSchema = z.object({
  url: z.string().url(),
});

const ALLOWED_HOSTS = new Set([
  "linkedin.com",
  "www.linkedin.com",
  "fr.linkedin.com",
  "welcometothejungle.com",
  "www.welcometothejungle.com",
  "indeed.com",
  "fr.indeed.com",
  "www.indeed.com",
  "jobteaser.com",
  "www.jobteaser.com",
]);

const MAX_BYTES = 2_000_000;
const MAX_TEXT_CHARS = 25_000;

const FETCH_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9,fr;q=0.8",
};

/**
 * Strip script / style / svg / nav / footer chunks and convert the rest to
 * readable plain text. Intentionally simple — we just need enough text for
 * the LLM to extract structure. Job-board scrape quality is brittle by
 * design; we expose `partial: true` when we suspect the result is thin.
 */
function htmlToText(html: string): string {
  let s = html;

  // Drop entire elements that never carry copy
  s = s.replace(/<script[\s\S]*?<\/script>/gi, " ");
  s = s.replace(/<style[\s\S]*?<\/style>/gi, " ");
  s = s.replace(/<noscript[\s\S]*?<\/noscript>/gi, " ");
  s = s.replace(/<svg[\s\S]*?<\/svg>/gi, " ");
  s = s.replace(/<header[\s\S]*?<\/header>/gi, " ");
  s = s.replace(/<footer[\s\S]*?<\/footer>/gi, " ");
  s = s.replace(/<nav[\s\S]*?<\/nav>/gi, " ");
  s = s.replace(/<aside[\s\S]*?<\/aside>/gi, " ");

  // Replace structural tags with newlines so paragraphs survive
  s = s.replace(
    /<\/(p|h1|h2|h3|h4|h5|h6|li|tr|br|div|section|article)>/gi,
    "\n"
  );
  s = s.replace(/<br\s*\/?>/gi, "\n");

  // Strip remaining tags
  s = s.replace(/<[^>]+>/g, " ");

  // Decode the most common HTML entities
  s = s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");

  // Collapse whitespace, preserve paragraph breaks
  s = s
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n");

  // De-dup consecutive identical lines (boilerplate menus etc.)
  const seen: string[] = [];
  for (const line of s.split("\n")) {
    if (seen.length === 0 || seen[seen.length - 1] !== line) seen.push(line);
  }
  s = seen.join("\n");

  return s.slice(0, MAX_TEXT_CHARS);
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "bad_request", message: "Invalid JSON body." } },
      { status: 400 }
    );
  }

  const parsed = requestSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: { code: "bad_request", message: "Provide a valid URL." },
      },
      { status: 400 }
    );
  }

  let url: URL;
  try {
    url = new URL(parsed.data.url);
  } catch {
    return NextResponse.json(
      { error: { code: "bad_request", message: "Provide a valid URL." } },
      { status: 400 }
    );
  }

  const host = url.hostname.toLowerCase();
  if (!ALLOWED_HOSTS.has(host)) {
    return NextResponse.json(
      {
        error: {
          code: "host_not_supported",
          message: `Host "${host}" not supported. Try LinkedIn, Welcome to the Jungle, Indeed, or JobTeaser — or paste the text directly.`,
        },
      },
      { status: 422 }
    );
  }

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      headers: FETCH_HEADERS,
      redirect: "follow",
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: {
          code: "fetch_failed",
          message:
            err instanceof Error ? err.message : "Network error fetching the URL.",
        },
      },
      { status: 502 }
    );
  }

  if (!response.ok) {
    return NextResponse.json(
      {
        error: {
          code: "fetch_failed",
          message: `Upstream responded ${response.status}. The page may require login.`,
        },
      },
      { status: 422 }
    );
  }

  const reader = response.body?.getReader();
  if (!reader) {
    return NextResponse.json(
      { error: { code: "fetch_failed", message: "Empty response body." } },
      { status: 502 }
    );
  }

  let received = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > MAX_BYTES) {
      reader.cancel();
      break;
    }
    chunks.push(value);
  }
  const buffer = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    buffer.set(chunk.subarray(0, Math.min(chunk.byteLength, MAX_BYTES - offset)), offset);
    offset += chunk.byteLength;
    if (offset >= MAX_BYTES) break;
  }

  const html = new TextDecoder("utf-8", { fatal: false }).decode(buffer);
  const text = htmlToText(html);

  if (text.length < 200) {
    return NextResponse.json(
      {
        error: {
          code: "thin_content",
          message:
            "Extracted text is very short — the page may be JavaScript-rendered or behind login. Paste the posting manually.",
        },
      },
      { status: 422 }
    );
  }

  return NextResponse.json({ text, host, url: url.toString() });
}
