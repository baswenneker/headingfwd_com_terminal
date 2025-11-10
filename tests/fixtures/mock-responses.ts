/**
 * Static mock response fixtures for AI chat responses
 * These are used to mock OpenAI API responses in tests
 */

export const MOCK_RESPONSES = {
  /**
   * Simple text response without any formatting
   */
  SIMPLE_TEXT:
    "Hello! I'm an AI assistant. I can help you with various tasks and answer your questions.",

  /**
   * Response with markdown formatting (bold, italic, links)
   */
  WITH_MARKDOWN: `I can help you with **bold text**, *italic text*, and [links](https://example.com).

You can also use inline \`code\` for technical terms.`,

  /**
   * Response with a code block
   */
  WITH_CODE_BLOCK: `Here's a simple JavaScript function:

\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}!\`;
}
\`\`\`

You can call it like this: \`greet("World")\``,

  /**
   * Response with a markdown list
   */
  WITH_LIST: `Here are my key features:

- Natural language understanding
- Code generation and debugging
- Technical documentation help
- Problem-solving assistance

Feel free to ask me anything!`,

  /**
   * Response with numbered list
   */
  WITH_NUMBERED_LIST: `Here's how to get started:

1. First, install the dependencies
2. Then, configure your environment
3. Finally, run the development server
4. Visit localhost:3000 in your browser`,

  /**
   * Response with headings
   */
  WITH_HEADINGS: `# Main Heading

## Getting Started

This is some introductory text.

### Prerequisites

You'll need Node.js installed.

### Installation

Run \`npm install\` to get started.`,

  /**
   * Long response to test scrolling
   */
  LONG_RESPONSE: `This is a very long response that will test the scrolling behavior of the terminal.

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.

## Section 1

More content here with various paragraphs to make this response longer than the visible terminal area.

${Array(10)
  .fill(0)
  .map(
    (_, i) =>
      `Paragraph ${i + 1}: Additional content to test scrolling behavior.`,
  )
  .join("\n\n")}

## Conclusion

This should have triggered scrolling behavior.`,

  /**
   * Response with multiple links
   */
  WITH_MULTIPLE_LINKS: `Check out these resources:

- [GitHub](https://github.com)
- [Documentation](https://docs.example.com)
- [LinkedIn](https://linkedin.com)
- [Portfolio](https://example.com)`,

  /**
   * Technical response with code and explanation
   */
  TECHNICAL: `To solve this issue, you need to understand **async/await** in JavaScript.

Here's an example:

\`\`\`typescript
async function fetchData() {
  try {
    const response = await fetch('/api/data');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error:', error);
  }
}
\`\`\`

Key points:
1. Use \`async\` keyword for async functions
2. Use \`await\` for promises
3. Always handle errors with try/catch`,

  /**
   * Response about services (matches terminal context)
   */
  ABOUT_SERVICES: `I specialize in:

**AI Engineering**
- LLM integration and optimization
- Custom AI solutions
- Prompt engineering

**Full-Stack Development**
- React, Next.js, TypeScript
- Node.js, Python
- Database design

**Consulting**
- Architecture review
- Code review
- Technical mentorship`,

  /**
   * Empty/short response
   */
  SHORT: "Yes.",

  /**
   * Response with emoji (if supported)
   */
  WITH_EMOJI: "Great question! 👍 Let me explain...",
};

/**
 * Error response fixtures
 */
export const ERROR_RESPONSES = {
  RATE_LIMIT: "Rate limit exceeded. Please try again later.",
  SESSION_EXPIRED: "Your session has expired. Please refresh the page.",
  INVALID_INPUT: "Invalid input. Please try again.",
  SERVER_ERROR: "An error occurred. Please try again.",
  NETWORK_ERROR: "Network error. Please check your connection.",
};

/**
 * Streaming chunk fixtures (for testing progressive rendering)
 */
export const STREAMING_CHUNKS = {
  FAST: [
    "Hello",
    "Hello there!",
    "Hello there! How",
    "Hello there! How can",
    "Hello there! How can I",
    "Hello there! How can I help",
    "Hello there! How can I help you?",
  ],

  WITH_MARKDOWN: [
    "Sure,",
    "Sure, here's",
    "Sure, here's a",
    "Sure, here's a **bold**",
    "Sure, here's a **bold** example",
    "Sure, here's a **bold** example with",
    "Sure, here's a **bold** example with [link](https://example.com).",
  ],
};
