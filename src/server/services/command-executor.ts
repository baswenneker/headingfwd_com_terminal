/**
 * Command Executor Service
 *
 * Executes commands without LLM involvement for instant responses.
 * All command handlers are defined here and return markdown-formatted text.
 */

import {
  findCommand,
  getActiveCommands,
  type CommandDefinition,
} from "~/config/commands";

export interface CommandResult {
  success: boolean;
  response?: string;
  metadata?: Record<string, unknown>;
  error?: string;
  statusCode?: number;
  /** Optional URL to open in a new window */
  openUrl?: string;
}

/**
 * Command handler functions
 * Each function returns markdown-formatted text for display in the terminal
 */
const commandHandlers: Record<string, () => Promise<string>> = {
  /**
   * Generate help text dynamically based on available commands
   */
  getHelpText: async () => {
    const activeCommands = getActiveCommands();

    // Group commands by category
    const commandsByCategory = activeCommands.reduce(
      (acc, cmd) => {
        acc[cmd.category] ??= [];
        acc[cmd.category]!.push(cmd);
        return acc;
      },
      {} as Record<string, CommandDefinition[]>,
    );

    let helpText = "**These commands are available:**\n\n";

    // Add commands grouped by category
    for (const cmds of Object.values(commandsByCategory)) {
      for (const cmd of cmds) {
        helpText += `**${cmd.command}** - ${cmd.description}\n\n`;
      }
    }

    helpText +=
      "\nYou can also ask me anything naturally - I'll help you with information about Bas, AI engineering, or the services offered!";

    return helpText;
  },

  /**
   * Get AI engineering services information
   */
  getServices: async () => {
    return `**AI Engineering Services**

Bas specializes in helping teams leverage Generative AI effectively. Here's what he offers:

**1. Agentic Workflow Development**

- Build production-ready AI agents and virtual employees
- Design multi-step workflows with human-in-the-loop patterns
- Create reliable, maintainable agent systems
- Evaluate and optimize agent performance

**2. AI Strategy & Consultancy**

- Evaluate AI use cases and ROI potential
- Architecture design for LLM applications
- Technology stack recommendations
- Best practices for production deployments


**3. Evaluation & Testing**
- Build evaluation frameworks for LLM outputs
- Implement automated testing pipelines
- Performance monitoring and observability
- A/B testing for prompt variations

**Technologies I Work With:**

- **LLM Providers**: OpenAI, Anthropic (Claude), Google, open-source models
- **Frameworks**: LangChain, LangGraph, Vercel AI SDK
- **Stack**: Next.js, TypeScript, React
- **Observability**: LangSmith, Ragas, Orq, custom evaluation tools

Interested in working together? Use **/contact** to get in touch!`;
  },

  /**
   * Get contact information
   * Note: This is the sensitive data we want to keep server-side only
   */
  getContact: async () => {
    return `**Get in Touch**

Here's how to reach Bas:

1. Just tell my assistant you want to send me a message right here in the terminal :)
2. Connect with him professionally on LinkedIn and send a DM: [linkedin.com/in/baswenneker](https://www.linkedin.com/in/baswenneker)
3. For direct inquiries: [bas@headingfwd.com](mailto:bas@headingfwd.com)`;
  },

  /**
   * Get information about how this terminal was built
   * Opens the GitHub repository in a new window
   */
  getHowIBuiltThisInfo: async () => {
    return `**Opening GitHub Repository...**

This terminal chatbot is fully open source! The repository will open in a new tab (or click [here](https://github.com/baswenneker/headingfwd_com_terminal)).

**What you'll find:**

* Complete source code with TypeScript and Next.js
* AI SDK integration
* Command system architecture
* Database schema and rate limiting
* CAPTCHA integration with Cloudflare Turnstile

Check out the code to see how it all works!`;
  },

  /**
   * Open Bas's LinkedIn profile
   * Opens LinkedIn in a new window
   */
  getLinkedInInfo: async () => {
    return `**Opening LinkedIn Profile...**

Bas's professional profile will open in a new tab (or click [here](https://www.linkedin.com/in/baswenneker)).

Connect with him to see:

* Professional experience and background
* AI engineering expertise
* Projects and recommendations
* Latest updates and articles`;
  },
};

/**
 * Execute a command without LLM involvement
 */
export async function executeCommand(command: string): Promise<CommandResult> {
  // Normalize command (lowercase, trim)
  const normalizedCommand = command.toLowerCase().trim();

  // Find command in registry
  const commandDef = findCommand(normalizedCommand);

  if (!commandDef) {
    return {
      success: false,
      error: `Unknown command: ${command}. Type **/help** to see available commands.`,
      statusCode: 404,
    };
  }

  try {
    let response: string;

    // Handle based on response type
    if (commandDef.responseType === "static") {
      // Static response: use predefined content
      response = commandDef.responseContent ?? "";
    } else if (
      commandDef.responseType === "dynamic" &&
      commandDef.handlerFunction
    ) {
      // Dynamic response: call handler function
      const handler = commandHandlers[commandDef.handlerFunction];
      if (!handler) {
        throw new Error(
          `Handler function not found: ${commandDef.handlerFunction}`,
        );
      }
      response = await handler();
    } else {
      throw new Error("Invalid command configuration");
    }

    // For commands that open URLs, include the URL to open
    const openUrl =
      commandDef.command === "/how-i-built-this"
        ? "https://github.com/baswenneker/headingfwd_com_terminal"
        : commandDef.command === "/linkedin"
          ? "https://www.linkedin.com/in/baswenneker"
          : undefined;

    return {
      success: true,
      response,
      openUrl,
      metadata: {
        command: commandDef.command,
        category: commandDef.category,
        executedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error("[Command Execution Error]", { command, error });
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to execute command",
      statusCode: 500,
    };
  }
}

/**
 * Get list of all available commands for the GET /api/commands endpoint
 */
export function getAvailableCommands() {
  return getActiveCommands().map((cmd) => ({
    command: cmd.command,
    description: cmd.description,
    category: cmd.category,
  }));
}
