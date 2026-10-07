import { CommandDeepLink, commandMetadata } from "../command-deep-link";

export const metadata = commandMetadata("agents");

export default function AgentsPage() {
  return <CommandDeepLink token="agents" />;
}
