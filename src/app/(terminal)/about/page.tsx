import { CommandDeepLink, commandMetadata } from "../command-deep-link";

export const metadata = commandMetadata("about");

export default function AboutPage() {
  return <CommandDeepLink token="about" />;
}
