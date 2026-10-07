import { CommandDeepLink, commandMetadata } from "../command-deep-link";

export const metadata = commandMetadata("contact");

export default function ContactPage() {
  return <CommandDeepLink token="contact" />;
}
