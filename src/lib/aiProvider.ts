import { GoogleGenAI } from "@google/genai";
import { geminiJsonSchema, SYSTEM_PROMPT } from "./aiDiagram";

export class ProviderError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
}

const OUTPUT_FORMAT_HINT = `Return ONLY a JSON object. No markdown, no code fences, no explanation. Use exactly this shape:
{"tables":[{"name":"students","columns":[{"name":"id","type":"INT","isPrimaryKey":true},{"name":"full_name","type":"VARCHAR","isPrimaryKey":false}]}],"relationships":[{"parent":"students","child":"enrollments","type":"one-to-many"}]}`;

export async function callGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new ProviderError("GEMINI_API_KEY is missing");
  const model = process.env.GEMINI_MODEL ?? "gemini-3.5-flash-lite";

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model,
      contents: `Design a PostgreSQL ERD for: ${prompt}`,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseJsonSchema: geminiJsonSchema,
        temperature: 0.3,
      },
    });
    return response.text ?? "";
  } catch (e) {
    const status = (e as { status?: number }).status;
    throw new ProviderError(
      e instanceof Error ? e.message : "Gemini failed",
      status,
    );
  }
}
export async function callOpenRouter(prompt: string): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL;
  if (!apiKey || !model)
    throw new ProviderError("OpenRouter is not configured");

  let res: Response;
  try {
    res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "X-Title": "ERD Tool",
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        messages: [
          {
            role: "system",
            content: `${SYSTEM_PROMPT}\n\n${OUTPUT_FORMAT_HINT}`,
          },
          { role: "user", content: `Design a PostgreSQL ERD for: ${prompt}` },
        ],
      }),
      signal: AbortSignal.timeout(20_000),
    });
  } catch (e) {
    throw new ProviderError(
      e instanceof Error ? e.message : "OpenRouter network error",
    );
  }

  if (!res.ok) {
    throw new ProviderError(`OpenRouter HTTP ${res.status}`, res.status);
  }

  try {
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string | null } }>;
    };
    return data.choices?.[0]?.message?.content ?? "";
  } catch {
    throw new ProviderError("OpenRouter returned a non-JSON response");
  }
}

// Models sometimes wrap JSON in ``` fences or add extra text. Try to recover it.
export function extractJson(text: string): unknown | null {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");

  try {
    return JSON.parse(cleaned);
  } catch {
    // fall through
  }

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start !== -1 && end > start) {
    try {
      return JSON.parse(cleaned.slice(start, end + 1));
    } catch {
      return null;
    }
  }
  return null;
}
