# Lessons

Persistent memory across sessions. Newest entries at the bottom.

Format:

```
### YYYY-MM-DD | <type> | <scope>
**Context**: [what was happening]
**Observation**: [what went wrong / was observed]
**Lesson**: [what to do next time]
```

Types: `correction` | `insight` | `rule-gap` | `deviation`.

### 2026-06-30 | insight | fonts
**Context**: Block-art ASCII banner (U+2588 full-block chars) styled with font-family:inherit, inheriting a JetBrains Mono webfont loaded via next/font/google with subsets:['latin'].
**Observation**: The banner rendered as an unreadable blob: the latin subset excludes the Block Elements range, so the full-block glyph fell back to a different font whose advance width differs from the webfont's space, breaking the monospace grid.
**Lesson**: For block/box-drawing ASCII art, do not inherit a subsetted webfont — set an explicit system-monospace stack (ui-monospace, Menlo, Consolas, ...) on that element so the block glyph and the space share one advance width. next/font subset names never include Block Elements.

### 2026-06-30 | insight | nextjs-dev
**Context**: Toggling a NEXT_PUBLIC_* env var (NEXT_PUBLIC_DISABLE_CAPTCHA) via a new .env.local and restarting the Turbopack dev server, to make a client-gated overlay appear during testing.
**Observation**: The client kept reading the old value: NEXT_PUBLIC_* vars are inlined into the client bundle at compile time, and the stale .next/Turbopack cache served the previous value across reboots, so the override silently had no effect.
**Lesson**: When changing a NEXT_PUBLIC_* value for local testing, clear .next (rm -rf .next) before restarting the dev server so the new value is re-inlined; verify the change took effect (e.g. the gated UI now behaves differently) rather than assuming the .env.local override applied.

### 2026-06-30 | insight | ai-sdk-testing
**Context**: Rewriting Playwright mocks for /api/chat after the app moved to AI SDK v6 (useChat + toUIMessageStreamResponse).
**Observation**: The existing mocks used the old data-stream wire format (0:"text" for text, 9:/a: for tool calls), which v6 useChat silently does not parse — the assistant message never renders, so the tests just time out with no obvious cause.
**Lesson**: When mocking an AI SDK v6 streaming endpoint, emit the UI-message-stream SSE format: header x-vercel-ai-ui-message-stream: v1, content-type text/event-stream, and 'data: {json}' events of type start/start-step/text-start/text-delta(id,delta)/text-end/finish-step/finish then [DONE]; tools use tool-input-start, tool-input-available(toolCallId,toolName,input) and tool-output-available(toolCallId,output). Confirm the exact chunk schema from node_modules/ai rather than guessing.
