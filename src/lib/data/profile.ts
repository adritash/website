export const profile = {
  name: "Dwaipayan Rajguru",
  initials: "DR",
  role: "Senior Enterprise Architect & Technology Leader",
  location: "Pune, India",
  tagline:
    "I design and deliver enterprise cloud modernisation and AI transformation programmes that reduce cost, improve reliability, and unlock real business capability.",
  summary:
    "15+ years delivering enterprise-scale IT programmes across FinTech and regulated industries. I specialise in enterprise architecture, multi-cloud migration, and AI implementation — always focused on measurable business outcomes, not just technical outputs.",
  philosophy:
    "Technology only matters when it moves the business forward. I start with architecture and clarity, stay through delivery, and measure success by outcomes — speed, resilience, cost, and capability.",
  leadership:
    "I lead cross-functional teams of 10–20 engineers, architects, and vendor partners. My style is direct, collaborative, and outcome-oriented — I tell stakeholders what I believe is true, including when the answer is hard.",
  education: {
    degree: "BE — Electronics & Communication Engineering",
    institution: "Nagpur University",
    year: "2010",
  },
} as const;

export const stats = [
  { value: 15, suffix: "+", label: "Years Experience" },
  { value: 15, suffix: "+", label: "Apps Migrated" },
  { value: 25, suffix: "%", label: "Avg. Cost Reduction", prefix: "~" },
  { value: 99.9, suffix: "%", label: "Uptime Delivered" },
] as const;

export const principles = [
  {
    title: "Architecture First",
    body: "Good outcomes start with clear structure. I invest in architecture because it determines what's possible downstream.",
  },
  {
    title: "Outcomes Over Outputs",
    body: "Delivered software is an output. I measure success by the business outcomes it unlocks.",
  },
  {
    title: "Honest Counsel",
    body: "Advisory relationships only create value when they're built on trust — including hard truths.",
  },
] as const;
