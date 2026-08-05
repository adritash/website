import type { Metadata } from "next";
import PageHero from "@/components/sections/PageHero";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import ProfilePhoto from "@/components/ui/ProfilePhoto";
import Section from "@/components/ui/Section";
import { certifications } from "@/lib/data/certifications";
import { experience } from "@/lib/data/experience";
import { profile } from "@/lib/data/profile";
import { skillCategories } from "@/lib/data/skills";
import { createPageMetadata } from "@/lib/metadata";
import { assets } from "@/lib/site";

export const metadata: Metadata = createPageMetadata({
  title: "Resume",
  description: `Resume of ${profile.name} — Senior Enterprise Architect with 15+ years in cloud modernisation, AI, and programme delivery.`,
  path: "/resume",
});

export default function ResumePage() {
  return (
    <>
      <PageHero
        eyebrow="Resume"
        title="Professional summary"
        description="A concise overview of my experience, skills, and credentials."
      />

      <Section background="white">
        <div className="mx-auto max-w-3xl">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-6">
              <ProfilePhoto size="md" />
              <div>
                <h2 className="text-2xl font-bold text-foreground">{profile.name}</h2>
                <p className="mt-1 font-medium text-brand">{profile.role}</p>
                <p className="mt-1 text-sm text-muted">{profile.location}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                href={assets.resumePdf}
                download={assets.resumeFilename}
              >
                Download PDF
              </Button>
              <Button href="/contact" variant="secondary">
                Contact Me
              </Button>
            </div>
          </div>

          <Card hover={false} className="mt-8">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-brand">
              Summary
            </h3>
            <p className="mt-3 leading-relaxed text-muted">{profile.summary}</p>
          </Card>

          <div className="mt-10">
            <h3 className="text-lg font-bold text-foreground">Experience</h3>
            <ul className="mt-4 space-y-4">
              {experience.map((job) => (
                <li key={job.id} className="border-b border-border pb-4 last:border-0">
                  <p className="font-semibold text-foreground">{job.role}</p>
                  <p className="text-sm text-brand">
                    {job.company} · {job.period}
                  </p>
                  <p className="mt-1 text-sm text-muted">{job.impact}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-10">
            <h3 className="text-lg font-bold text-foreground">Core Skills</h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {skillCategories.flatMap((c) => c.skills.slice(0, 3)).map((s) => (
                <span
                  key={s}
                  className="rounded-full bg-brand-light px-3 py-1 text-xs font-medium text-brand"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-10">
            <h3 className="text-lg font-bold text-foreground">Education</h3>
            <p className="mt-2 text-muted">
              {profile.education.degree} — {profile.education.institution} ({profile.education.year})
            </p>
          </div>

          <div className="mt-10">
            <h3 className="text-lg font-bold text-foreground">Certifications</h3>
            <ul className="mt-4 space-y-2">
              {certifications.map((cert) => (
                <li key={cert.name} className="text-sm text-muted">
                  <span className="font-medium text-foreground">{cert.name}</span>
                  {" — "}
                  {cert.issuer}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>
    </>
  );
}
