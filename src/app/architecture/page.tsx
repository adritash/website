import type { Metadata } from "next";
import ArchitectureDashboard from "@/components/sections/ArchitectureDashboard";
import CTABand from "@/components/ui/CTABand";
import { createPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Reference Architectures",
  description:
    "End-to-end cloud reference architectures — FinTech, AI automation, HR workflows, procurement, and enterprise operations on AWS and GCP.",
  path: "/architecture",
});

export default function ArchitecturePage() {
  return (
    <>
      <ArchitectureDashboard />

      <CTABand
        title="Want to discuss a similar architecture?"
        buttonLabel="Get in Touch"
        buttonHref="/contact"
      />
    </>
  );
}
