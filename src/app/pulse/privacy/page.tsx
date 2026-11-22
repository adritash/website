import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/metadata";
import { contact } from "@/lib/site";
import LegalPage from "../LegalPage";

export const metadata: Metadata = createPageMetadata({
  title: "Pulse privacy notice",
  description: "How ADRITASH Pulse collects, uses, keeps and deletes your data.",
  path: "/pulse/privacy",
});

export default function PulsePrivacyPage() {
  return (
    <LegalPage title="Privacy notice" updated="privacy-2026-11-v1">
      <h2>Who we are</h2>
      <p>ADRITASH Pulse is a WhatsApp information service operated by ADRITASH. Contact: {contact.email}.</p>

      <h2>What we collect</h2>
      <ul>
        <li>Your WhatsApp number and profile name, as provided by WhatsApp when you message us.</li>
        <li>Your messages to Pulse and our replies.</li>
        <li>Your watchlist, alert settings, consent choices and plan.</li>
        <li>If you subscribe to a paid plan: payment status from our payment provider. We never receive card or UPI details.</li>
      </ul>

      <h2>Why we use it</h2>
      <ul>
        <li>To answer your requests and send the updates and alerts you asked for.</li>
        <li>To enforce plan limits, prevent abuse and keep the service secure.</li>
        <li>To measure costs and reliability. We do not sell your data or use it for advertising.</li>
      </ul>

      <h2>Your consent</h2>
      <p>
        We ask you to reply AGREE before we save a watchlist or alerts. Each recurring update or alert is sent only because you asked for it.
        You can withdraw consent any time: reply STOP to stop all proactive messages, or stop a single alert (for example “stop TCS updates”).
      </p>

      <h2>How we protect it</h2>
      <ul>
        <li>Your phone number is encrypted at rest and looked up by a keyed hash.</li>
        <li>Staff access is restricted and logged; full numbers are not shown in our admin tools.</li>
        <li>Message text is deleted after 30 days. Security logs are kept for up to one year.</li>
      </ul>

      <h2>Who we share it with</h2>
      <ul>
        <li>Meta (WhatsApp Business Platform), to deliver messages.</li>
        <li>Our hosting, database and market-data providers, only as needed to run the service.</li>
        <li>An AI provider may process the text of a message to understand it when our built-in rules cannot. It does not receive your number or other users’ data.</li>
        <li>Our payment provider, if you subscribe.</li>
      </ul>

      <h2>Your rights</h2>
      <p>
        You can ask what we hold, ask us to correct it, or erase it. Reply DELETE MY DATA on WhatsApp, then YES DELETE to confirm, or write to {contact.email}.
        If you are not satisfied with our response you may approach the Data Protection Board of India.
      </p>

      <h2>Age</h2>
      <p>Pulse is intended for adults (18+).</p>
    </LegalPage>
  );
}
