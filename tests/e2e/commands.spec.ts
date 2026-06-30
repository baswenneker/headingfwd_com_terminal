import { test, expect } from "@playwright/test";
import {
  navigateToTerminal,
  sendCommand,
  waitForTerminalReady,
} from "../helpers/session";
import { COMMAND_TEXT } from "../fixtures/command-outputs";

/**
 * Tests for the client-static slash-command system.
 *
 * Slash-commands are processed entirely in the browser by terminal-commands.ts.
 * Pressing Enter for a "/" input triggers a synchronous React state update —
 * no network request is made. The output appears in the terminal feed as typed
 * lines (head, out, bullet, row, link, etc.). These tests type a command,
 * press Enter, and assert the expected visible text in the feed.
 *
 * Note: the `[data-testid="assistant-message"]` element is only rendered for
 * AI replies, never for slash-commands. Assertions here target text directly.
 */
test.describe("Terminal slash commands", () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTerminal(page);
    await waitForTerminalReady(page);
  });

  test("/help renders the available-commands header and all command row labels", async ({
    page,
  }) => {
    await sendCommand(page, "/help");

    await expect(page.getByText(COMMAND_TEXT.HELP.header)).toBeVisible();
    for (const cmd of COMMAND_TEXT.HELP.commands) {
      // Row labels are rendered as tappable buttons; .first() selects the
      // feed occurrence rather than any duplicate in the static intro.
      await expect(page.getByText(cmd).first()).toBeVisible();
    }
    // Dim tip line at the bottom of the help block.
    await expect(
      page.getByText(COMMAND_TEXT.HELP.tip, { exact: false }),
    ).toBeVisible();
  });

  test("/about renders the whoami header and Bas Wenneker bio line", async ({
    page,
  }) => {
    await sendCommand(page, "/about");

    await expect(page.getByText(COMMAND_TEXT.ABOUT.header)).toBeVisible();
    await expect(
      page.getByText(COMMAND_TEXT.ABOUT.content, { exact: false }),
    ).toBeVisible();
  });

  test("/services renders the header and all four bullet items", async ({
    page,
  }) => {
    await sendCommand(page, "/services");

    await expect(page.getByText(COMMAND_TEXT.SERVICES.header)).toBeVisible();
    for (const bullet of COMMAND_TEXT.SERVICES.bullets) {
      await expect(page.getByText(bullet, { exact: false })).toBeVisible();
    }
  });

  test("/work renders the engagements header and all four job names", async ({
    page,
  }) => {
    await sendCommand(page, "/work");

    await expect(page.getByText(COMMAND_TEXT.WORK.header)).toBeVisible();
    for (const job of COMMAND_TEXT.WORK.jobs) {
      await expect(page.getByText(job, { exact: false })).toBeVisible();
    }
  });

  test("/stack renders the stack header and the technology list", async ({
    page,
  }) => {
    await sendCommand(page, "/stack");

    await expect(page.getByText(COMMAND_TEXT.STACK.header)).toBeVisible();
    await expect(
      page.getByText(COMMAND_TEXT.STACK.content, { exact: false }),
    ).toBeVisible();
  });

  test("/contact renders the header, email link, and LinkedIn link", async ({
    page,
  }) => {
    await sendCommand(page, "/contact");

    await expect(page.getByText(COMMAND_TEXT.CONTACT.header)).toBeVisible();
    await expect(
      page.getByRole("link", { name: COMMAND_TEXT.CONTACT.email }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: COMMAND_TEXT.CONTACT.linkedin }),
    ).toBeVisible();
  });

  test("/clear empties the terminal feed", async ({ page }) => {
    // Add content to the feed first.
    await sendCommand(page, "/about");
    await expect(
      page.getByText(COMMAND_TEXT.ABOUT.content, { exact: false }),
    ).toBeVisible();

    // /clear resets the blocks array; the about content should disappear.
    await sendCommand(page, "/clear");

    await expect(
      page.getByText(COMMAND_TEXT.ABOUT.content, { exact: false }),
    ).not.toBeVisible();
  });

  test("/cls alias clears the feed just like /clear does", async ({ page }) => {
    await sendCommand(page, "/services");
    await expect(page.getByText(COMMAND_TEXT.SERVICES.header)).toBeVisible();

    await sendCommand(page, "/cls");

    await expect(
      page.getByText(COMMAND_TEXT.SERVICES.header),
    ).not.toBeVisible();
  });

  test("/whoami alias renders the guest welcome line", async ({ page }) => {
    await sendCommand(page, "/whoami");
    await expect(
      page.getByText(COMMAND_TEXT.WHOAMI, { exact: false }),
    ).toBeVisible();
  });

  test("/ls alias renders the fake directory listing", async ({ page }) => {
    await sendCommand(page, "/ls");
    await expect(
      page.getByText(COMMAND_TEXT.LS, { exact: false }),
    ).toBeVisible();
  });

  test("ArrowUp recalls the last submitted command into the input field", async ({
    page,
  }) => {
    const input = page.getByTestId("terminal-input");

    // Submit a command so it is added to the history buffer.
    await sendCommand(page, "/help");
    // After submission the input is cleared.
    await expect(input).toHaveValue("");

    // ArrowUp should restore the last history entry.
    await input.press("ArrowUp");
    await expect(input).toHaveValue("/help");
  });

  test("ArrowDown after ArrowUp moves back to an empty input", async ({
    page,
  }) => {
    const input = page.getByTestId("terminal-input");

    await sendCommand(page, "/help");
    await input.press("ArrowUp");
    await expect(input).toHaveValue("/help");

    await input.press("ArrowDown");
    await expect(input).toHaveValue("");
  });

  test("multiple commands in sequence all append their output to the feed", async ({
    page,
  }) => {
    await sendCommand(page, "/about");
    await expect(
      page.getByText(COMMAND_TEXT.ABOUT.content, { exact: false }),
    ).toBeVisible();

    await sendCommand(page, "/services");
    // Both the about content and the services header must be visible.
    await expect(
      page.getByText(COMMAND_TEXT.ABOUT.content, { exact: false }),
    ).toBeVisible();
    await expect(page.getByText(COMMAND_TEXT.SERVICES.header)).toBeVisible();

    await sendCommand(page, "/contact");
    await expect(
      page.getByRole("link", { name: COMMAND_TEXT.CONTACT.email }),
    ).toBeVisible();
  });

  test("commands complete instantly — no loading indicator appears", async ({
    page,
  }) => {
    await sendCommand(page, "/help");

    // The loading indicator is only rendered during AI streaming, never for
    // slash-commands. It must be absent from the DOM.
    await expect(
      page.locator('[data-testid="loading-indicator"]'),
    ).not.toBeVisible();
  });

  test("the CAPTCHA overlay is never triggered by slash-commands", async ({
    page,
  }) => {
    await sendCommand(page, "/contact");

    await expect(
      page.locator('[data-testid="captcha-overlay"]'),
    ).not.toBeVisible();
  });
});

/**
 * Tests that exercise the terminal at a narrow mobile viewport (375 × 667 px).
 *
 * The terminal window must fit horizontally without adding a scrollbar, and
 * slash-commands must remain functional when the responsive layout reflows.
 */
test.describe("Mobile viewport (375 px wide)", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test.beforeEach(async ({ page }) => {
    await navigateToTerminal(page);
    await waitForTerminalReady(page);
  });

  test("terminal loads without horizontal overflow at 375 px", async ({
    page,
  }) => {
    const noOverflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    );
    expect(noOverflow).toBe(true);
  });

  test("slash-commands render their output at narrow width", async ({
    page,
  }) => {
    await sendCommand(page, "/help");
    await expect(page.getByText(COMMAND_TEXT.HELP.header)).toBeVisible();
    // At least one command label must be visible to confirm the feed rendered.
    await expect(page.getByText("/about").first()).toBeVisible();
  });
});
