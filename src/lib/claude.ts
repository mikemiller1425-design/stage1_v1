import Anthropic from "@anthropic-ai/sdk";

/** Latest generally available Sonnet model on the Anthropic API. */
export const CLAUDE_MODEL = "claude-sonnet-5";

export function getAnthropicClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not configured. Add it to your environment and restart the server.",
    );
  }

  return new Anthropic({ apiKey });
}

export function extractTextFromClaudeMessage(
  content: Anthropic.Messages.ContentBlock[],
): string {
  return content
    .filter((block): block is Anthropic.Messages.TextBlock => block.type === "text")
    .map((block) => block.text.trim())
    .filter(Boolean)
    .join("\n\n");
}
