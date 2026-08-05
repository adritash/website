export const assets = {
  profilePhoto: "/images/dwai-formal.png",
  resumePdf: "/resume/Dwaipayan_Rajguru_Resume.pdf",
  resumeFilename: "Dwaipayan_Rajguru_Resume.pdf",
} as const;

export const siteConfig = {
  name: "Dwaipayan Rajguru",
  brand: "Adritash",
  tagline: "Enterprise Architect · Cloud & AI Leader",
  description:
    "Personal portfolio of Dwaipayan Rajguru — 15+ years in enterprise architecture, cloud modernisation, and AI transformation across FinTech and regulated industries.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://adritash.com",
  founder: "Dwaipayan Rajguru",
  role: "Senior Enterprise Architect & Technology Leader",
  location: "Pune, India",
} as const;

export const contact = {
  email: "drajguru28@gmail.com",
  phone: "+91-9503303717",
  phoneHref: "tel:+919503303717",
  emailHref: "mailto:drajguru28@gmail.com",
} as const;

export const social = {
  linkedin: "https://www.linkedin.com/in/dwaipayanrajguru/",
  credly: "https://www.credly.com/users/dwaipayan_rajguru/badges/credly",
} as const;

export const navLinks = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Experience", href: "/experience" },
  { label: "Skills", href: "/skills" },
  { label: "Projects", href: "/projects" },
  { label: "Insights", href: "/insights" },
  { label: "Resume", href: "/resume" },
] as const;

export const footerLinks = [
  { label: "About", href: "/about" },
  { label: "Experience", href: "/experience" },
  { label: "Skills", href: "/skills" },
  { label: "Projects", href: "/projects" },
  { label: "Insights", href: "/insights" },
  { label: "Resume", href: "/resume" },
  { label: "Contact", href: "/contact" },
] as const;
