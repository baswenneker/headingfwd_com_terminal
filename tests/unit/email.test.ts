import { describe, expect, it } from "vitest";
import {
  createEmailTemplate,
  formatConversationHistory,
  sendContactEmail,
} from "~/server/services/email";
import type { ModelMessage } from "ai";

/**
 * `~/server/services/email`. `escapeHtml` itself is not exported — it is
 * exercised indirectly through `formatConversationHistory` and
 * `createEmailTemplate`, both of which call it on every user-supplied string
 * before it reaches the HTML body. See the note in this file's directory
 * listing if a direct export of `escapeHtml` would be preferred instead.
 */
describe("formatConversationHistory", () => {
  it("returns an empty string for no messages", () => {
    expect(formatConversationHistory([])).toBe("");
  });

  it("skips messages with empty or whitespace-only text content", () => {
    const messages: ModelMessage[] = [
      { role: "user", content: "   " },
      { role: "assistant", content: "" },
      { role: "user", content: "Hello there" },
    ];
    const html = formatConversationHistory(messages);
    expect(html).toContain("Hello there");
    // Two roles ("User"/"Assistant" labels) would appear per included
    // message; only one message survived the blank filter.
    expect(html.match(/👤 User|🤖 Assistant/g)).toHaveLength(1);
  });

  it("HTML-escapes message content", () => {
    const messages: ModelMessage[] = [
      { role: "user", content: '<script>alert("xss")</script>' },
    ];
    const html = formatConversationHistory(messages);
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });
});

describe("createEmailTemplate", () => {
  it("HTML-escapes the sender address and the message body", () => {
    const html = createEmailTemplate({
      senderEmail: '"><img src=x onerror=alert(1)>@example.com',
      message: '<b>bold</b> & "quoted"',
    });
    expect(html).not.toContain("<img src=x onerror=alert(1)>");
    expect(html).not.toContain("<b>bold</b>");
    expect(html).toContain("&lt;b&gt;bold&lt;/b&gt;");
    expect(html).toContain("&amp;");
    expect(html).toContain("&quot;quoted&quot;");
  });

  it("includes the conversation history block when provided", () => {
    const html = createEmailTemplate({
      senderEmail: "visitor@example.com",
      message: "Hi",
      conversationHtml: "<div>history</div>",
    });
    expect(html).toContain("<div>history</div>");
  });
});

describe("sendContactEmail", () => {
  it("short-circuits under ENVIRONMENT=test without touching Resend", async () => {
    // tests/unit/setup.ts sets ENVIRONMENT=test before any import, which is
    // exactly the branch that must never place a real API call.
    const result = await sendContactEmail({
      sessionId: "session_unit_test",
      senderEmail: "visitor@example.com",
      message: "Hello",
      conversationHistory: [],
    });
    expect(result.success).toBe(true);
    expect(result.messageId).toMatch(/^test_email_\d+$/);
  });
});
