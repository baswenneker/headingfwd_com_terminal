---
# headingfwd_com_terminal-cue1
title: Fix email flow E2E tests failing after AI SDK v6 upgrade
status: completed
type: bug
priority: high
tags:
    - ai-sdk
    - e2e-tests
    - tool-calling
created_at: 2026-01-12T06:40:38Z
updated_at: 2026-01-12T14:58:38Z
---

## Problem

After upgrading all packages to latest versions (2025-01-07), 5 out of 33 E2E tests are failing. All failing tests are in `tests/e2e/email-flow.spec.ts` and are related to the AI tool calling flow for sending emails.

## Failing Tests

1. `should complete full email flow - happy path`
2. `should not send without confirmation`
3. `should handle message length requirements`
4. `should include conversation history in email context`
5. `should handle different confirmation phrases`

## Error Pattern

All tests timeout with the same error:
```
TimeoutError: page.waitForFunction: Timeout 10000ms exceeded.
at sendTerminalMessage (tests/helpers/session.ts:85:14)
```

The tests wait for a new `assistant-message` element to appear, but the streaming response hangs.

## Root Cause Analysis

From the test failure screenshots (see `test-results/` directory), the issue appears to be:

1. User sends message: "I want to send you a message"
2. Assistant starts responding: "Great\! To..."
3. The "Thinking..." indicator stays visible
4. No complete assistant message is added to the DOM

This suggests the streaming response is started but not completed/finalized properly.

## Relevant Package Upgrades

| Package | Old Version | New Version |
|---------|-------------|-------------|
| ai (Vercel AI SDK) | 5.0.81 | **6.0.16** |
| @ai-sdk/openai | 2.0.56 | **3.0.7** |
| @ai-sdk/react | 2.0.81 | **3.0.16** |
| zod | 3.25.76 | **4.3.5** |

## Breaking Changes Already Fixed

1. `CoreMessage` → `ModelMessage` type rename
2. `convertToModelMessages()` is now async (added await)
3. `ZodError.errors` → `ZodError.issues`
4. ESLint config migrated to Next.js 16 flat config format

## What Works

- ✅ All 10 chat streaming tests pass
- ✅ All 12 command tests pass
- ✅ TypeScript compilation
- ✅ ESLint
- ✅ Production build
- ✅ Basic AI responses (non-tool-calling)

## Possible Causes

1. **AI SDK v6 streaming format changes** - The `toUIMessageStreamResponse()` may handle tool calling steps differently
2. **Multi-step tool calling** - The email flow uses `stopWhen: stepCountIs(20)` which may behave differently in v6
3. **Frontend part handling** - The `useChat` hook may process streaming parts differently for tool calls
4. **Timing/race condition** - The test timeout (10s) may be too short for multi-step tool interactions

## Files to Investigate

- `src/app/api/chat/route.ts` - Server-side streaming with tool calling
- `src/app/_components/chat-terminal.tsx` - Frontend `useChat` hook usage
- `tests/helpers/session.ts:85` - Test helper waiting for assistant messages
- `tests/e2e/email-flow.spec.ts` - Failing test cases

## Suggested Investigation Steps

1. Increase test timeouts to rule out timing issues
2. Add console logging to track streaming chunks
3. Check AI SDK v6 migration guide for tool calling changes
4. Verify `toUIMessageStreamResponse()` output format
5. Test email flow manually in browser to see if it works outside tests
