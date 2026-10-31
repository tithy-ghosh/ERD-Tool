import { NextResponse } from "next/server";
import { buildDiagram } from "../../../lib/aiDiagram";
import {
  callGemini,
  callOpenRouter,
  extractJson,
  ProviderError,
} from "../../../lib/aiProvider";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BODY_CHARS = 2000;
const MIN_PROMPT = 3;
const MAX_PROMPT = 200;

// Very simple in-memory limit: 5 requests per minute per IP.
// Best effort only (serverless instances do not share memory).
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 5;
const hits = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_REQUESTS) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  return false;
}

type Provider = { name: string; call: (prompt: string) => Promise<string> };

function getProviders(): Provider[] {
  const list: Provider[] = [];
  if (process.env.GEMINI_API_KEY) {
    list.push({ name: "gemini", call: callGemini });
  }
  if (process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_MODEL) {
    list.push({ name: "openrouter", call: callOpenRouter });
  }
  return list;
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a minute." },
      { status: 429 }
    );
  }

  const providers = getProviders();
  if (providers.length === 0) {
    console.error("No AI provider is configured");
    return NextResponse.json({ error: "AI is not configured." }, { status: 500 });
  }

  // Read body safely
  const text = await req.text();
  if (text.length > MAX_BODY_CHARS) {
    return NextResponse.json({ error: "Request is too large." }, { status: 413 });
  }

  let prompt: string;
  try {
    const body = JSON.parse(text) as { prompt?: unknown };
    if (typeof body.prompt !== "string") throw new Error("bad prompt");
    prompt = body.prompt.trim();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (prompt.length < MIN_PROMPT || prompt.length > MAX_PROMPT) {
    return NextResponse.json(
      { error: `Prompt must be ${MIN_PROMPT}-${MAX_PROMPT} characters.` },
      { status: 400 }
    );
  }

  let sawRateLimit = false;

  // Try each provider in order. If one fails, go to the next.
  for (const provider of providers) {
    for (let attempt = 0; attempt < 2; attempt++) {
      let raw: string;
      try {
        raw = await provider.call(prompt);
      } catch (e) {
        const status = e instanceof ProviderError ? e.status : undefined;
        console.error(
          `[${provider.name}] call failed:`,
          e instanceof Error ? e.message : e
        );
        if (status === 429) sawRateLimit = true;
        break; // provider problem, move to the next provider
      }

      const json = extractJson(raw);
      if (json === null) {
        console.error(`[${provider.name}] output was not valid JSON (attempt ${attempt + 1})`);
        continue; // bad output, retry the same provider once
      }

      const built = buildDiagram(json, prompt.slice(0, 100));
      if (built.ok) {
        return NextResponse.json(built.data, {
          headers: { "x-ai-provider": provider.name },
        });
      }
      console.error(`[${provider.name}] output rejected:`, built.error);
    }
  }

  if (sawRateLimit) {
    return NextResponse.json(
      { error: "AI limit reached. Please try again in a minute." },
      { status: 429 }
    );
  }
  return NextResponse.json(
    { error: "AI could not make a valid diagram. Try a simpler prompt." },
    { status: 502 }
  );
}