/**
 * Expected command outputs for terminal commands
 * These match the actual responses from the command executor
 */

export const COMMAND_OUTPUTS = {
  /**
   * /help command output
   * Shows all available commands
   */
  HELP: `# Available Commands

Here are the commands you can use:

**Help & Information**
- \`/help\` - Show this help message

**Services**
- \`/services\` - Learn about my AI engineering and development services

**Contact**
- \`/contact\` - Get my contact information

**Project Info**
- \`/how-i-built-this\` - Learn how I built this terminal interface
- \`/linkedin\` - Opens Bas's LinkedIn profile (opens in a new tab)`,

  /**
   * /services command output
   */
  SERVICES: `# AI Engineering & Development Services

I specialize in building AI-powered applications and full-stack solutions.

## Core Services

**AI Engineering**
- LLM integration (OpenAI, Anthropic, etc.)
- Custom AI solutions and workflows
- Prompt engineering and optimization
- RAG (Retrieval-Augmented Generation) systems

**Full-Stack Development**
- React, Next.js, TypeScript
- Node.js, Python backends
- Database design and optimization
- Real-time applications

**Technical Consulting**
- Architecture review and design
- Code review and optimization
- Technical mentorship
- AI strategy and implementation

[Contact me](/contact) to discuss your project!`,

  /**
   * /contact command output
   */
  CONTACT: `# Contact Information

**Get in Touch**

- 📧 Email: [bas@headingfwd.com](mailto:bas@headingfwd.com)
- 💼 LinkedIn: [linkedin.com/in/bastienmartinez](https://linkedin.com/in/bastienmartinez)
- 🐙 GitHub: [github.com/bastienmartinez](https://github.com/bastienmartinez)
- 🌐 Website: [headingfwd.com](https://headingfwd.com)

Feel free to reach out for consulting, collaboration, or just to chat about AI and tech!`,

  /**
   * /how-i-built-this command output
   */
  HOW_I_BUILT_THIS: `# How I Built This Terminal

This terminal interface is built with modern web technologies:

**Tech Stack**
- Next.js 15 with App Router
- React 19 with TypeScript
- Tailwind CSS for styling
- Vercel AI SDK for streaming responses
- OpenAI GPT models
- Drizzle ORM with SQLite
- tRPC for type-safe APIs

**Key Features**
- Streaming AI responses
- Custom markdown renderer
- Session management with CAPTCHA
- Rate limiting
- Command system for instant responses

Check out the code on [GitHub](https://github.com/bastienmartinez/terminal) to see how it works!

*Opening repository in new tab...*`,

  /**
   * Unknown/invalid command output
   */
  UNKNOWN_COMMAND: `Unknown command. Type \`/help\` for available commands.`,

  /**
   * Error responses
   */
  ERRORS: {
    RATE_LIMIT:
      "You've sent too many messages. Please wait a moment before trying again.",
    SESSION_EXPIRED: "Your session has expired. Please refresh the page.",
    INVALID_INPUT: "Please enter a valid command or message.",
  },
};

/**
 * Command patterns for matching
 */
export const COMMAND_PATTERNS = {
  HELP: /available commands/i,
  SERVICES: /ai engineering|development services/i,
  CONTACT: /contact information|email|linkedin/i,
  HOW_I_BUILT_THIS: /how i built this|tech stack|next\.js/i,
  LINKEDIN: /opening linkedin|linkedin profile|professional experience/i,
};
