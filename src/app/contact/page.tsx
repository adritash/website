import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Contact",
  description:
    "Get in touch with Dwaipayan Rajguru for enterprise architecture, cloud migration, and AI transformation consulting.",
  path: "/contact",
});

export { default } from "./ContactForm";
