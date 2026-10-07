import { CommandDeepLink, commandMetadata } from "../command-deep-link";

export const metadata = commandMetadata("services");

export default function ServicesPage() {
  return <CommandDeepLink token="services" />;
}
