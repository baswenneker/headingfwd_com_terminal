import { Resend } from "resend";
import type { CoreMessage } from "ai";
import { env } from "~/env";
import { db } from "~/server/db";
import { emailLogs } from "~/server/db/schema";
import { logError } from "~/lib/errors";

// Initialize Resend client
const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

/**
 * Escape HTML special characters to prevent XSS
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]!);
}

/**
 * Format conversation history as HTML for email
 */
export function formatConversationHistory(messages: CoreMessage[]): string {
  if (!messages || messages.length === 0) {
    return "";
  }

  let html =
    '<div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #ddd;">';
  html +=
    '<h3 style="color: #333; margin-bottom: 15px;">📜 Conversation History</h3>';

  for (const msg of messages) {
    const roleColor = msg.role === "user" ? "#0066cc" : "#28a745";
    const roleLabel = msg.role === "user" ? "👤 User" : "🤖 Assistant";

    // Extract text content from message
    let content = "";
    if (typeof msg.content === "string") {
      content = msg.content;
    } else if (Array.isArray(msg.content)) {
      content = msg.content
        .filter((part) => part.type === "text")
        .map((part) => ("text" in part ? part.text : ""))
        .join("\n");
    }

    if (content.trim().length > 0) {
      html += `
        <div style="margin-bottom: 15px; padding: 12px; background: #f8f9fa; border-left: 3px solid ${roleColor}; border-radius: 4px;">
          <strong style="color: ${roleColor};">${roleLabel}:</strong>
          <p style="margin: 8px 0 0 0; white-space: pre-wrap; color: #333;">${escapeHtml(content)}</p>
        </div>
      `;
    }
  }

  html += "</div>";
  return html;
}

/**
 * Create HTML email template
 */
export function createEmailTemplate(params: {
  senderEmail: string;
  message: string;
  conversationHtml?: string;
}): string {
  const { senderEmail, message, conversationHtml } = params;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Message from Terminal Chat</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">💬 New Message from Terminal Chat</h1>
  </div>

  <div style="background: white; padding: 30px; border: 1px solid #e1e4e8; border-top: none; border-radius: 0 0 10px 10px;">
    <div style="margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #e1e4e8;">
      <p style="margin: 5px 0;"><strong>From:</strong> <a href="mailto:${escapeHtml(senderEmail)}" style="color: #0066cc; text-decoration: none;">${escapeHtml(senderEmail)}</a></p>
      <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date().toLocaleString("en-US", { timeZone: "UTC", dateStyle: "full", timeStyle: "long" })}</p>
    </div>

    <div style="margin-top: 20px; padding: 20px; background: #f6f8fa; border-radius: 6px; border-left: 4px solid #0366d6;">
      <h3 style="margin-top: 0; color: #0366d6;">Message:</h3>
      <div style="white-space: pre-wrap; color: #333;">${escapeHtml(message)}</div>
    </div>

    ${conversationHtml ?? ""}

    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e1e4e8; color: #666; font-size: 12px;">
      <p style="margin: 5px 0;">This message was sent from the terminal chat interface on headingfwd.com</p>
      <p style="margin: 5px 0;">Reply directly to this email to respond to the sender.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Send contact email via Resend API
 */
export async function sendContactEmail(params: {
  sessionId: string;
  senderEmail: string;
  message: string;
  conversationHistory: CoreMessage[];
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { sessionId, senderEmail, message, conversationHistory } = params;

  // In test environment, return mock response without sending real emails
  if (process.env.ENVIRONMENT === "test" || process.env.NODE_ENV === "test") {
    return {
      success: true,
      messageId: `test_email_${Date.now()}`,
    };
  }

  // Check if Resend is configured
  if (!resend || !env.RESEND_API_KEY) {
    const error =
      "Email service is not configured. Missing RESEND_API_KEY environment variable.";
    logError("sendContactEmail", new Error(error), { sessionId, senderEmail });
    return { success: false, error };
  }

  try {
    // Format conversation history
    const conversationHtml = formatConversationHistory(conversationHistory);

    // Create email HTML
    const htmlBody = createEmailTemplate({
      senderEmail,
      message,
      conversationHtml,
    });

    // Generate subject line
    const subject = `New message from ${senderEmail} via Terminal Chat`;

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: "Terminal Chat <terminal@chat.headingfwd.com>",
      to: "bas@headingfwd.com",
      replyTo: senderEmail,
      subject,
      html: htmlBody,
    });

    if (error) {
      // Log failure to database
      await db.insert(emailLogs).values({
        sessionId,
        senderEmail,
        senderName: null,
        subject,
        bodyPreview: message.substring(0, 1000),
        resendMessageId: null,
        status: "failed",
        errorMessage: error.message,
        createdAt: new Date(),
      });

      logError("sendContactEmail - Resend API error", error, {
        sessionId,
        senderEmail,
      });
      return { success: false, error: error.message };
    }

    // Log success to database
    await db.insert(emailLogs).values({
      sessionId,
      senderEmail,
      senderName: null,
      subject,
      bodyPreview: message.substring(0, 1000),
      resendMessageId: data?.id ?? null,
      status: "sent",
      errorMessage: null,
      createdAt: new Date(),
    });

    return { success: true, messageId: data?.id };
  } catch (error) {
    // Log unexpected error to database
    await db.insert(emailLogs).values({
      sessionId,
      senderEmail,
      senderName: null,
      subject: `New message from ${senderEmail} via Terminal Chat`,
      bodyPreview: message.substring(0, 1000),
      resendMessageId: null,
      status: "failed",
      errorMessage: error instanceof Error ? error.message : "Unknown error",
      createdAt: new Date(),
    });

    logError("sendContactEmail - Unexpected error", error, {
      sessionId,
      senderEmail,
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send email",
    };
  }
}
