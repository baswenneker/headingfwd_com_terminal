/**
 * Command Registry Configuration
 *
 * Defines all available commands for the terminal chatbot.
 * Commands are executed server-side without LLM involvement for instant responses.
 */

export interface CommandDefinition {
  /** Command name (e.g., "/help") */
  command: string;
  /** Short description of what the command does */
  description: string;
  /** Category for grouping commands */
  category: "help" | "info" | "contact" | "services" | "navigation";
  /** Response type: static text or dynamic handler function */
  responseType: "static" | "dynamic";
  /** For static responses: the markdown text to return */
  responseContent?: string;
  /** For dynamic responses: name of the handler function */
  handlerFunction?: string;
  /** Whether this command is currently active */
  isActive: boolean;
  /** Display order in help menu */
  displayOrder: number;
}

/**
 * Command Registry
 * Add new commands here to make them available in the terminal
 */
export const COMMAND_REGISTRY: CommandDefinition[] = [
  {
    command: "/help",
    description: "Show available commands and capabilities",
    category: "help",
    responseType: "dynamic",
    handlerFunction: "getHelpText",
    isActive: true,
    displayOrder: 1,
  },
  {
    command: "/services",
    description: "View AI engineering services offered",
    category: "services",
    responseType: "dynamic",
    handlerFunction: "getServices",
    isActive: true,
    displayOrder: 2,
  },
  {
    command: "/how-i-built-this",
    description:
      "Check out my public Github repository (this opens in a new tab)",
    category: "info",
    responseType: "dynamic",
    handlerFunction: "getHowIBuiltThisInfo",
    isActive: true,
    displayOrder: 2,
  },
  {
    command: "/linkedin",
    description: "Opens Bas's LinkedIn profile (opens in a new tab)",
    category: "info",
    responseType: "dynamic",
    handlerFunction: "getLinkedInInfo",
    isActive: true,
    displayOrder: 3,
  },
  {
    command: "/contact",
    description: "Get contact information",
    category: "contact",
    responseType: "dynamic",
    handlerFunction: "getContact",
    isActive: true,
    displayOrder: 4,
  },
];

/**
 * Get all active commands sorted by display order
 */
export function getActiveCommands(): CommandDefinition[] {
  return COMMAND_REGISTRY.filter((cmd) => cmd.isActive).sort(
    (a, b) => a.displayOrder - b.displayOrder,
  );
}

/**
 * Find a command by its name (case-insensitive)
 */
export function findCommand(
  commandName: string,
): CommandDefinition | undefined {
  const normalized = commandName.toLowerCase().trim();
  return COMMAND_REGISTRY.find(
    (cmd) => cmd.command.toLowerCase() === normalized && cmd.isActive,
  );
}
