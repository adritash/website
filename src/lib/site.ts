export const assets = {
  profilePhoto: "/images/dwai-formal.png",
  logo: "/logo/adritash-logo.jpg",
  emblem: "/logo/adritash-emblem.png",
  lockup: "/logo/adritash-lockup-v3.png",
  ogImage: "/og-image.jpg",
  resumePdf: "/resume/Dwaipayan_Rajguru_Resume.pdf",
  resumeFilename: "Dwaipayan_Rajguru_Resume.pdf",
} as const;

export const siteConfig = {
  name: "Dwaipayan Rajguru",
  brand: "ADRITASH",
  tagline: "Architecting Intelligence. Engineering the Future.",
  description:
    "ADRITASH is an enterprise technology consultancy led by founder Dwaipayan Rajguru — enterprise architecture, cloud modernisation, and AI transformation for FinTech and regulated industries.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.adritash.com",
  founder: "Dwaipayan Rajguru",
  role: "Senior Enterprise Architect & Technology Leader",
  location: "Pune, India",
} as const;

export const contact = {
  email: "contact@adritash.com",
  phone: "+91-9425255657",
  phoneHref: "tel:+919425255657",
  emailHref: "mailto:contact@adritash.com",
} as const;

export const social = {
  linkedin: "https://www.linkedin.com/in/dwaipayanrajguru/",
  linkedinCompany: "https://www.linkedin.com/company/adritash",
  credly: "https://www.credly.com/users/dwaipayan_rajguru/badges/credly",
} as const;

export const aboutLinks = [
  {
    title: "Experience",
    href: "/experience",
    description: "15+ years enterprise career timeline & leadership roles",
    badge: "Career",
  },
  {
    title: "Skills & Expertise",
    href: "/skills",
    description: "Enterprise architecture, cloud platforms, AI & technical PM",
    badge: "Expertise",
  },
  {
    title: "Projects & Outcomes",
    href: "/projects",
    description: "Proven business outcomes across cloud, AI and FinTech programs",
    badge: "Delivery",
  },
  {
    title: "About Overview",
    href: "/about",
    description: "Mission, founder profile & engineering leadership philosophy",
    badge: "Profile",
  },
] as const;

export const dashboardLinks = [
  {
    title: "ADRITASH PM Toolkit",
    shortTitle: "PM Toolkit",
    href: "/dashboards/project-management",
    description: "AI tools for delivery teams: RAID generator, status reports and more",
    badge: "Delivery",
  },
  {
    title: "Enterprise Architecture Dashboard",
    shortTitle: "Enterprise Architecture",
    href: "/architecture",
    description: "Interactive cloud reference architectures, schematics & data flows",
    badge: "Architecture",
  },
  {
    title: "Presentation Dashboard",
    shortTitle: "Presentation",
    href: "/dashboards/presentation",
    description: "Executive briefings, strategy decks, roadmaps & keynote materials",
    badge: "Executive",
  },
] as const;

export const navLinks = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about", isDropdown: true, dropdownType: "about" as const },
  { label: "Dashboards", href: "/dashboards", isDropdown: true, dropdownType: "dashboards" as const },
  { label: "Insights", href: "/insights" },
  { label: "Resume", href: "/resume" },
] as const;

export const footerLinks = [
  { label: "About", href: "/about" },
  { label: "Experience", href: "/experience" },
  { label: "Skills", href: "/skills" },
  { label: "Architecture", href: "/architecture" },
  { label: "Projects", href: "/projects" },
  { label: "Insights", href: "/insights" },
  { label: "Resume", href: "/resume" },
  { label: "Contact", href: "/contact" },
] as const;
