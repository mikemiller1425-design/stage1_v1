import { afterEach, describe, expect, it } from "vitest";
import {
  CLAUDE_MODEL,
  extractTextFromClaudeMessage,
  getAnthropicClient,
} from "@/lib/claude";
import { withEnv } from "../../tests/helpers/temp-fs";

const cleanups: Array<() => void> = [];

afterEach(() => {
  while (cleanups.length > 0) {
    cleanups.pop()?.();
  }
});

describe("getAnthropicClient", () => {
  it("throws a clear error when API key is missing", () => {
    cleanups.push(withEnv({ ANTHROPIC_API_KEY: undefined }));
    expect(() => getAnthropicClient()).toThrow(/ANTHROPIC_API_KEY/);
  });

  it("creates a client when API key is present", () => {
    cleanups.push(withEnv({ ANTHROPIC_API_KEY: "sk-test-key" }));
    const client = getAnthropicClient();
    expect(client).toBeTruthy();
    expect(CLAUDE_MODEL).toBe("claude-sonnet-5");
  });
});

describe("extractTextFromClaudeMessage", () => {
  it("joins text blocks and ignores non-text blocks", () => {
    const text = extractTextFromClaudeMessage([
      { type: "text", text: "First", citations: [] },
      {
        type: "tool_use",
        id: "1",
        name: "noop",
        input: {},
      } as never,
      { type: "text", text: "  Second  ", citations: [] },
    ]);

    expect(text).toBe("First\n\nSecond");
  });

  it("returns empty string when there is no text", () => {
    expect(extractTextFromClaudeMessage([])).toBe("");
  });
});
