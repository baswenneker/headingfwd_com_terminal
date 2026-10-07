import { CommandDeepLink, commandMetadata } from "../command-deep-link";

export const metadata = commandMetadata("stack");

export default function StackPage() {
  return <CommandDeepLink token="stack" />;
}
