import type { Metadata } from "next";
import PageHero from "@/components/sections/PageHero";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import ProfilePhoto from "@/components/ui/ProfilePhoto";
import Section from "@/components/ui/Section";
import { certifications } from "@/lib/data/certifications";
import { experience } from "@/lib/data/experience";
import { profile } from "@/lib/data/profile";
import { coreCompetencies } from "@/lib/data/skills";
import { createPageMetadata } from "@/lib/metadata";
import { assets } from "@/lib/site";

export const metadata: Metadata = createPageMetadata({
  title: "Resume",
  description: `Resume of ${profile.name} — ${profile.headline}.`,
  path: "/resume",
});

export default function ResumePage() {
  return (
    <>
      <PageHero
        eyebrow="Resume"
        title="Professional summary"
        description="Updated 21 September 2026 — experience, competencies, and credentials."
      />

      <Section background="white">
        <div className="mx-auto max-w-3xl">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-6">
              <ProfilePhoto size="md" priority />
              <div>
                <h2 className="text-2xl font-bold text-foreground">{profile.name}</h2>
                <p className="mt-1 font-medium text-brand">{profile.headline}</p>
                <p className="mt-1 text-sm text-muted">
                  {profile.location} · {profile.relocation}
                </p>
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
            <h3 className="text-sm font-semibold uppercase tracking-widest text-gold-ink">
              Summary
            </h3>
            <p className="mt-3 leading-relaxed text-muted">{profile.summary}</p>
          </Card>

          <div className="mt-10">
            <h3 className="text-lg font-bold text-foreground">Experience</h3>
            <ul className="mt-4 space-y-6">
              {experience.map((job) => (
                <li key={job.id} className="border-b border-border pb-6 last:border-0">
                  <p className="font-semibold text-foreground">{job.role}</p>
                  <p className="text-sm text-brand">
                    {job.company}, {job.location} · {job.period}
                  </p>
                  <ul className="mt-3 space-y-2">
                    {job.highlights.map((highlight) => (
                      <li key={highlight} className="flex gap-2 text-sm leading-relaxed text-muted">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" aria-hidden="true" />
                        {highlight}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-10">
            <h3 className="text-lg font-bold text-foreground">Core Competencies</h3>
            <div className="mt-4 space-y-5">
              {coreCompetencies.map((group) => (
                <div key={group.name}>
                  <p className="text-sm font-semibold text-foreground">{group.name}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {group.skills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full bg-brand-light px-3 py-1 text-xs font-medium text-brand"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10">
            <h3 className="text-lg font-bold text-foreground">Education</h3>
            <ul className="mt-3 space-y-3">
              {profile.education.map((item) => (
                <li key={item.degree} className="text-muted">
                  <p className="font-medium text-foreground">{item.degree}</p>
                  <p className="text-sm">
                    {item.institution} · {item.year}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-10">
            <h3 className="text-lg font-bold text-foreground">Certifications & Training</h3>
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
