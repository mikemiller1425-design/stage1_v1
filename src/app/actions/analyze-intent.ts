"use server";

import {
  CLAUDE_MODEL,
  extractTextFromClaudeMessage,
  getAnthropicClient,
} from "@/lib/claude";

export type AnalyzeIntentResult =
  | {
      ok: true;
      analysis: string;
      model: string;
    }
  | {
      ok: false;
      error: string;
    };

const INTENT_ANALYSIS_PROMPT = `You are performing Stage 1 Intent Analysis on a raw markdown intake document.

Analyze the document carefully and respond in clear, concise markdown using exactly these four sections:

## Core intent / true problem
What the author is really trying to solve or achieve, beyond surface wording.

## Key assumptions
Important assumptions implied or stated in the document.

## Differentiation
What makes this idea, approach, or request distinct — or where differentiation is weak/unclear.

## Open questions / risks
Unresolved questions, gaps, uncertainties, and risks that should be addressed next.

Keep the tone analytical and practical. Prefer short paragraphs and bullet points where helpful.
Do not invent product details that are not supported by the document; call out ambiguity instead.`;

export async function analyzeIntent(
  markdownContent: string,
): Promise<AnalyzeIntentResult> {
  const content = markdownContent.trim();

  if (!content) {
    return {
      ok: false,
      error: "This markdown file is empty, so Intent Analysis cannot run.",
    };
  }

  try {
    const client = getAnthropicClient();

    const message = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: `${INTENT_ANALYSIS_PROMPT}

---
MARKDOWN DOCUMENT
---

${content}`,
        },
      ],
    });

    const analysis = extractTextFromClaudeMessage(message.content);

    if (!analysis) {
      return {
        ok: false,
        error: "Claude returned an empty analysis. Please try again.",
      };
    }

    return {
      ok: true,
      analysis,
      model: message.model || CLAUDE_MODEL,
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unexpected error while calling Claude.";

    return {
      ok: false,
      error: message,
    };
  }
}
