import { describe, expect, it } from "vitest";
import type { UIMessage } from "ai";
import { groupTurns, withoutLastTurn } from "~/app/_components/chat-turns";

/**
 * R6 — the feed pairs each AI block with its own question and answer, also
 * after a turn that got no answer.
 */
let nextId = 0;
function msg(role: "user" | "assistant", text: string): UIMessage {
  return { id: `m${nextId++}`, role, parts: [{ type: "text", text }] };
}

function texts(turns: ReturnType<typeof groupTurns>) {
  return turns.map((t) => [
    (t.user.parts[0] as { text: string }).text,
    (t.assistant?.parts[0] as { text: string } | undefined)?.text,
  ]);
}

describe("groupTurns", () => {
  it("pairs each question with its answer", () => {
    const turns = groupTurns([
      msg("user", "q1"),
      msg("assistant", "a1"),
      msg("user", "q2"),
      msg("assistant", "a2"),
    ]);
    expect(texts(turns)).toEqual([
      ["q1", "a1"],
      ["q2", "a2"],
    ]);
  });

  it("keeps later answers on their own question after a failed turn", () => {
    const turns = groupTurns([
      msg("user", "q1"),
      msg("user", "q2"),
      msg("assistant", "a2"),
    ]);
    expect(texts(turns)).toEqual([
      ["q1", undefined],
      ["q2", "a2"],
    ]);
  });

  it("handles two failed turns in a row", () => {
    const turns = groupTurns([
      msg("user", "q1"),
      msg("assistant", "a1"),
      msg("user", "q2"),
      msg("user", "q3"),
      msg("user", "q4"),
      msg("assistant", "a4"),
    ]);
    expect(texts(turns)).toEqual([
      ["q1", "a1"],
      ["q2", undefined],
      ["q3", undefined],
      ["q4", "a4"],
    ]);
  });
});

describe("withoutLastTurn", () => {
  it("cuts before the last question, whether or not it was answered", () => {
    const q1 = msg("user", "q1");
    const a1 = msg("assistant", "a1");
    const q2 = msg("user", "q2");
    expect(withoutLastTurn([q1, a1, q2])).toEqual([q1, a1]);
    expect(withoutLastTurn([q1, a1, q2, msg("assistant", "x")])).toEqual([
      q1,
      a1,
    ]);
    expect(withoutLastTurn([])).toEqual([]);
  });
});
