import { type Metadata } from "next";
import { Terminal } from "~/app/_components/terminal";

// The homepage's own canonical. It is not set in the root layout, where it
// would also reach every 404 (see the robots note there).
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function Home() {
  return <Terminal />;
}
