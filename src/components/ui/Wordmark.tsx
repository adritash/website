import { siteConfig } from "@/lib/site";

type WordmarkProps = {
  /** Tailwind text-size classes. Letter spacing and weight stay fixed to match the logo. */
  className?: string;
};

/** The ADRITASH wordmark as in the logo: caps, wide tracking, champagne. Use this, never plain text. */
export default function Wordmark({ className = "text-sm" }: WordmarkProps) {
  return <span className={`wordmark ${className}`}>{siteConfig.brand}</span>;
}
