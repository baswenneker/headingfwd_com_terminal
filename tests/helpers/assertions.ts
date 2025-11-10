import { expect, type Page } from "@playwright/test";

/**
 * Custom assertion utilities for terminal tests
 */

/**
 * Assert that a message contains markdown link
 */
export async function expectMessageToContainLink(
  page: Page,
  linkText: string,
  href?: string,
) {
  const link = page.locator(`a:has-text("${linkText}")`);
  await expect(link).toBeVisible();

  if (href) {
    await expect(link).toHaveAttribute("href", href);
  }
}

/**
 * Assert that a message contains a code block
 */
export async function expectMessageToContainCodeBlock(
  page: Page,
  codeContent?: string,
) {
  const codeBlock = page.locator("pre code");
  await expect(codeBlock).toBeVisible();

  if (codeContent) {
    await expect(codeBlock).toContainText(codeContent);
  }
}

/**
 * Assert that error message is displayed
 */
export async function expectErrorMessage(page: Page, errorText: string) {
  const message = page.locator(`text=${errorText}`);
  await expect(message).toBeVisible();
}

/**
 * Assert that the terminal input is enabled
 */
export async function expectInputEnabled(page: Page) {
  const input = page.getByTestId("terminal-input");
  await expect(input).toBeEnabled();
}

/**
 * Assert that the terminal input is disabled
 */
export async function expectInputDisabled(page: Page) {
  const input = page.getByTestId("terminal-input");
  await expect(input).toBeDisabled();
}

/**
 * Assert that N messages are visible
 */
export async function expectMessageCount(page: Page, count: number) {
  const messages = page.locator('[data-testid*="message"]');
  await expect(messages).toHaveCount(count);
}

/**
 * Assert that a specific message exists at index
 */
export async function expectMessageAtIndex(
  page: Page,
  index: number,
  expectedText: string,
) {
  const messages = await page.locator('[data-testid*="message"]').all();
  const message = messages[index];
  expect(message).toBeDefined();
  const messageText = await message!.textContent();
  expect(messageText).toContain(expectedText);
}

/**
 * Assert that markdown list is rendered
 */
export async function expectMarkdownList(page: Page) {
  const list = page.locator("ul, ol");
  await expect(list).toBeVisible();
}

/**
 * Assert that markdown heading is rendered
 */
export async function expectMarkdownHeading(page: Page, headingText: string) {
  const heading = page.locator(`h1, h2, h3, h4, h5, h6`).filter({
    hasText: headingText,
  });
  await expect(heading).toBeVisible();
}

/**
 * Assert that new tab was opened with URL
 */
export async function expectNewTabOpened(
  page: Page,
  urlPattern: string | RegExp,
) {
  const [newPage] = await Promise.all([
    page.context().waitForEvent("page"),
    // The action that triggers the new tab should happen after this
  ]);

  if (typeof urlPattern === "string") {
    expect(newPage.url()).toContain(urlPattern);
  } else {
    expect(newPage.url()).toMatch(urlPattern);
  }

  return newPage;
}

/**
 * Assert that streaming is in progress (thinking indicator visible)
 */
export async function expectStreamingInProgress(page: Page) {
  const thinking = page.locator('text="Thinking..."');
  await expect(thinking).toBeVisible();
}

/**
 * Assert that streaming is complete (thinking indicator hidden)
 */
export async function expectStreamingComplete(page: Page) {
  const thinking = page.locator('text="Thinking..."');
  await expect(thinking).toBeHidden();
}

/**
 * Assert that response contains specific text
 */
export async function expectResponseToContain(page: Page, text: string) {
  const response = page.locator('[data-testid*="assistant-message"]').last();
  await expect(response).toContainText(text);
}

/**
 * Assert terminal has macOS window chrome (desktop only)
 */
export async function expectMacOSChrome(page: Page) {
  // Check for traffic light buttons or window title bar
  const chrome = page.locator('[class*="window"], [class*="chrome"]');
  await expect(chrome).toBeVisible();
}

/**
 * Assert rate limit error is displayed
 */
export async function expectRateLimitError(page: Page) {
  await expectErrorMessage(page, "Rate limit exceeded");
}

/**
 * Assert session expired error is displayed
 */
export async function expectSessionExpiredError(page: Page) {
  await expectErrorMessage(page, "expired");
}
