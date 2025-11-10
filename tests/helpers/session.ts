import { type Page } from "@playwright/test";
import { createTestSession } from "./database";
import { mockSessionInit } from "./api-mocks";

/**
 * Session management utilities for Playwright tests
 */

export interface SessionOptions {
  verified?: boolean;
  messageCount?: number;
  expiresInMinutes?: number;
  mockInit?: boolean;
}

/**
 * Create a test session and optionally mock the session init API
 */
export async function setupTestSession(page: Page, options?: SessionOptions) {
  const session = await createTestSession({
    verified: options?.verified ?? true,
    messageCount: options?.messageCount ?? 0,
    expiresInMinutes: options?.expiresInMinutes ?? 30,
  });

  if (!session) {
    throw new Error("Failed to create test session");
  }

  // Mock the session init tRPC call if requested
  if (options?.mockInit !== false) {
    await mockSessionInit(page, session.sessionId, true);
  }

  return session;
}

/**
 * Navigate to the terminal and ensure it's ready
 */
export async function navigateToTerminal(page: Page) {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
}

/**
 * Wait for terminal input to be ready
 */
export async function waitForTerminalReady(page: Page) {
  // Wait for the input field to be visible and enabled
  const input = page.getByTestId("terminal-input");
  await input.waitFor({ state: "visible" });

  // Wait for the input to be enabled (not disabled)
  await page.waitForFunction(
    () => {
      const input = document.querySelector('[data-testid="terminal-input"]');
      return input && !(input as HTMLInputElement).disabled;
    },
    { timeout: 10000 },
  );
}

/**
 * Get the terminal input field
 */
export function getTerminalInput(page: Page) {
  return page.getByTestId("terminal-input");
}

/**
 * Send a message in the terminal and wait for response
 */
export async function sendTerminalMessage(page: Page, message: string) {
  // Count existing messages before sending
  const messagesBefore = await page
    .locator('[data-testid="assistant-message"]')
    .count();

  const input = getTerminalInput(page);
  await input.fill(message);
  await input.press("Enter");

  // Wait for a new assistant message to appear
  await page.waitForFunction(
    (count) => {
      const messages = document.querySelectorAll(
        '[data-testid="assistant-message"]',
      );
      return messages.length > count;
    },
    messagesBefore,
    { timeout: 10000 },
  );
}

/**
 * Wait for a response message to appear
 */
export async function waitForResponse(page: Page, timeout = 10000) {
  // Wait for assistant message to appear
  await page.waitForSelector('[data-testid*="assistant-message"]', {
    timeout,
  });
}

/**
 * Get all messages from the terminal
 */
export async function getAllMessages(page: Page) {
  const messages = await page
    .locator('[data-testid*="message"]')
    .allTextContents();
  return messages;
}

/**
 * Get the last assistant message from the terminal
 */
export async function getLastMessage(page: Page) {
  const messages = await page
    .locator('[data-testid="assistant-message"]')
    .all();
  if (messages.length === 0) return null;
  const lastMessage = messages[messages.length - 1];
  return await lastMessage!.textContent();
}

/**
 * Wait for "Thinking..." indicator to appear
 */
export async function waitForThinkingIndicator(page: Page) {
  await page.waitForSelector('text="Thinking..."', { timeout: 5000 });
}

/**
 * Wait for "Thinking..." indicator to disappear
 */
export async function waitForThinkingToComplete(page: Page) {
  await page.waitForSelector('text="Thinking..."', { state: "hidden" });
}

/**
 * Check if CAPTCHA overlay is visible
 */
export async function isCaptchaVisible(page: Page) {
  const overlay = page.getByTestId("captcha-overlay");
  return await overlay.isVisible();
}

/**
 * Complete the CAPTCHA (should be bypassed in test mode)
 */
export async function completeCaptcha(page: Page) {
  // In test mode, CAPTCHA should be disabled
  // This function is here for completeness but shouldn't be needed
  const isVisible = await isCaptchaVisible(page);
  if (isVisible) {
    throw new Error("CAPTCHA should be disabled in test mode");
  }
}

/**
 * Wait for loading indicator to disappear (streaming complete)
 */
export async function waitForLoadingComplete(page: Page) {
  await page.waitForSelector('[data-testid="loading-indicator"]', {
    state: "hidden",
    timeout: 20000,
  });
}

/**
 * Check if the terminal input is currently focused
 */
export async function checkInputIsFocused(page: Page): Promise<boolean> {
  return await page.evaluate(() => {
    const input = document.querySelector('[data-testid="terminal-input"]');
    return document.activeElement === input;
  });
}
