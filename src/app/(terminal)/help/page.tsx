import { CommandDeepLink, commandMetadata } from "../command-deep-link";

export const metadata = commandMetadata("help");

export default function HelpPage() {
  return <CommandDeepLink token="help" />;
}
