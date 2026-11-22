import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/metadata";
import { contact } from "@/lib/site";
import LegalPage from "../LegalPage";

export const metadata: Metadata = createPageMetadata({
  title: "Pulse terms",
  description: "Terms of use for ADRITASH Pulse.",
  path: "/pulse/terms",
});

export default function PulseTermsPage() {
  return (
    <LegalPage title="Terms of use" updated="terms-2026-11-v1">
      <h2>Information only</h2>
      <p>
        Pulse relays market information from licensed data providers. It is not investment advice, research or a recommendation to buy or sell any security.
        ADRITASH is not a SEBI-registered investment adviser or research analyst. Make your own decisions or consult a registered adviser.
      </p>

      <h2>Data accuracy and delay</h2>
      <ul>
        <li>Prices are delayed (typically 15 minutes) unless a reply clearly says otherwise.</li>
        <li>Each price shows its time and source. Data can be late, missing or wrong; if we cannot get a reliable price we say so instead of guessing.</li>
        <li>Alerts are checked periodically during market hours and may arrive after a price move.</li>
      </ul>

      <h2>Coverage</h2>
      <p>NSE-listed equities (and BSE where our provider supports them). Updates run only on trading days per the official exchange calendar.</p>

      <h2>Messages and opting out</h2>
      <p>We only send scheduled updates and alerts you request. Reply STOP to stop all of them. Message limits apply by plan.</p>

      <h2>Paid plans</h2>
      <p>
        Paid plans are not on sale yet. When they are, the price including taxes, renewal terms, cancellation and refund policy will be shown before you pay,
        and payments will be processed by our payment provider.
      </p>

      <h2>Fair use</h2>
      <p>Do not use Pulse to send spam, attack the service or attempt to access other users’ data. We may suspend accounts that do.</p>

      <h2>Contact and grievances</h2>
      <p>{contact.email}</p>
    </LegalPage>
  );
}
