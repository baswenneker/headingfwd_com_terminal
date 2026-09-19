import { describe, expect, it } from "vitest";
import { runCommand } from "~/app/_components/terminal-commands";
import { CONTACT } from "~/content/site-content";

/**
 * `runCommand` (`~/app/_components/terminal-commands`) — pure, no DOM and no
 * network: it turns raw terminal input into a `CommandResult`. Assertions
 * stick to the structural contract (`action`, `href`/`url`, line `kind`s)
 * rather than exact copy, since the wording of individual command outputs is
 * a separate, judgement-level concern (see #13 group F) that can change
 * under this test without changing the routing behaviour it covers.
 */
describe("runCommand", () => {
  it("/help returns a lines result with the command echoed first", () => {
    const result = runCommand("/help");
    expect(result.action).toBe("lines");
    if (result.action !== "lines") return;
    expect(result.lines[0]).toEqual({ kind: "cmd", text: "/help" });
    expect(result.lines.some((l) => l.kind === "head")).toBe(true);
  });

  it("/clear and /cls both clear the feed", () => {
    expect(runCommand("/clear")).toEqual({ action: "clear" });
    expect(runCommand("/cls")).toEqual({ action: "clear" });
  });

  it("/portfolio navigates to /portfolio", () => {
    const result = runCommand("/portfolio");
    expect(result.action).toBe("navigate");
    if (result.action !== "navigate") return;
    expect(result.href).toBe("/portfolio");
    expect(result.lines[0]).toEqual({ kind: "cmd", text: "/portfolio" });
  });

  it("/blog navigates to /blog", () => {
    const result = runCommand("/blog");
    expect(result.action).toBe("navigate");
    if (result.action !== "navigate") return;
    expect(result.href).toBe("/blog");
  });

  it("/linkedin opens the LinkedIn URL", () => {
    const result = runCommand("/linkedin");
    expect(result.action).toBe("openurl");
    if (result.action !== "openurl") return;
    expect(result.url).toBe(CONTACT.linkedin);
    expect(
      result.lines.some(
        (l) => l.kind === "link" && l.href === CONTACT.linkedin,
      ),
    ).toBe(true);
  });

  it("an unrecognised command falls back to freeform output", () => {
    const result = runCommand("/not-a-real-command");
    expect(result.action).toBe("lines");
    if (result.action !== "lines") return;
    expect(result.lines[0]).toEqual({
      kind: "cmd",
      text: "/not-a-real-command",
    });
    // Freeform output is not the /help registry output: no "available
    // commands" head line.
    expect(
      result.lines.some(
        (l) => l.kind === "head" && l.text === "available commands",
      ),
    ).toBe(false);
  });

  it("is case-insensitive", () => {
    const upper = runCommand("/HELP");
    const lower = runCommand("/help");
    expect(upper.action).toBe(lower.action);
    if (upper.action !== "lines" || lower.action !== "lines") return;
    // Same output shape; only the echoed raw text differs in case.
    expect(upper.lines.slice(1)).toEqual(lower.lines.slice(1));
  });

  it("only the first whitespace-delimited word is the command token", () => {
    const result = runCommand("/help this trailing text is ignored");
    expect(result.action).toBe("lines");
    if (result.action !== "lines") return;
    expect(result.lines.some((l) => l.kind === "head")).toBe(true);
    expect(result.lines[0]).toEqual({
      kind: "cmd",
      text: "/help this trailing text is ignored",
    });
  });
});
