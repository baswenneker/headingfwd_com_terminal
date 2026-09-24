import type { UIMessage } from "ai";

/**
 * One visitor turn: the message they typed and, once it arrives, the answer.
 */
export interface ChatTurn {
  user: UIMessage;
  assistant?: UIMessage;
}

/**
 * Group the useChat messages into turns, one per user message.
 *
 * Each user message opens a turn; the first assistant message after it and
 * before the next user message is that turn's answer. A turn that failed
 * (rate limit, network error) has no answer and simply ends with the next
 * user message, so the N-th turn stays the N-th AI block in the feed. A
 * fixed "two messages per turn" rule cannot hold that: one failed turn
 * shifts every later answer onto the wrong question.
 */
export function groupTurns(messages: readonly UIMessage[]): ChatTurn[] {
  const turns: ChatTurn[] = [];
  for (const message of messages) {
    if (message.role === "user") {
      turns.push({ user: message });
    } else if (message.role === "assistant") {
      const current = turns.at(-1);
      if (current && !current.assistant) current.assistant = message;
    }
  }
  return turns;
}

/**
 * The messages with the last turn taken off: everything before the last
 * user message. Used to drop a turn the server refused, so the history
 * useChat sends next matches the feed again.
 */
export function withoutLastTurn(messages: readonly UIMessage[]): UIMessage[] {
  const lastUser = messages.map((m) => m.role).lastIndexOf("user");
  return lastUser >= 0 ? messages.slice(0, lastUser) : [...messages];
}
