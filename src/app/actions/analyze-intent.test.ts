import { afterEach, describe, expect, it, vi } from "vitest";

const createMock = vi.fn();

vi.mock("@/lib/claude", () => ({
  CLAUDE_MODEL: "claude-sonnet-5",
  getAnthropicClient: () => ({
    messages: {
      create: createMock,
    },
  }),
  extractTextFromClaudeMessage: (
    content: Array<{ type: string; text?: string }>,
  ) =>
    content
      .filter((block) => block.type === "text")
      .map((block) => block.text ?? "")
      .join("\n\n")
      .trim(),
}));

const { analyzeIntent } = await import("@/app/actions/analyze-intent");

afterEach(() => {
  createMock.mockReset();
});

describe("analyzeIntent", () => {
  it("rejects empty markdown content", async () => {
    await expect(analyzeIntent("   ")).resolves.toEqual({
      ok: false,
      error: "This markdown file is empty, so Intent Analysis cannot run.",
    });
    expect(createMock).not.toHaveBeenCalled();
  });

  it("returns analysis text from Claude", async () => {
    createMock.mockResolvedValueOnce({
      model: "claude-sonnet-5",
      content: [
        {
          type: "text",
          text: "## Core intent / true problem\n\nBuild intake.",
        },
      ],
    });

    const result = await analyzeIntent("# Notes\n\nSomething meaningful");
    expect(result).toEqual({
      ok: true,
      analysis: "## Core intent / true problem\n\nBuild intake.",
      model: "claude-sonnet-5",
    });

    expect(createMock).toHaveBeenCalledOnce();
    const args = createMock.mock.calls[0]?.[0];
    expect(args.model).toBe("claude-sonnet-5");
    expect(args.messages[0].content).toContain("# Notes");
    expect(args.messages[0].content).toContain("Core intent / true problem");
  });

  it("returns a clear error when Claude responds with empty text", async () => {
    createMock.mockResolvedValueOnce({
      model: "claude-sonnet-5",
      content: [],
    });

    await expect(analyzeIntent("# Notes")).resolves.toEqual({
      ok: false,
      error: "Claude returned an empty analysis. Please try again.",
    });
  });

  it("maps thrown API errors to ok:false", async () => {
    createMock.mockRejectedValueOnce(new Error("credit balance is too low"));

    await expect(analyzeIntent("# Notes")).resolves.toEqual({
      ok: false,
      error: "credit balance is too low",
    });
  });
});
