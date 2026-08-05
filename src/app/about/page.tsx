import type { Metadata } from "next";
import PageHero from "@/components/sections/PageHero";
import Card from "@/components/ui/Card";
import CTABand from "@/components/ui/CTABand";
import ProfilePhoto from "@/components/ui/ProfilePhoto";
import Section from "@/components/ui/Section";
import { certifications } from "@/lib/data/certifications";
import { profile, principles } from "@/lib/data/profile";
import { createPageMetadata } from "@/lib/metadata";
import { social } from "@/lib/site";

export const metadata: Metadata = createPageMetadata({
  title: "About",
  description: profile.summary,
  path: "/about",
});

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About"
        title={profile.name}
        description={profile.summary}
      />

      <Section background="white">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[auto_1fr] lg:gap-16">
          <div className="flex justify-center lg:justify-start">
            <ProfilePhoto size="lg" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">My story</h2>
            <div className="mt-6 space-y-5 leading-relaxed text-muted">
              <p>
                I&apos;m based in <strong className="text-foreground">{profile.location}</strong> with
                15+ years delivering enterprise-scale IT programmes, digital transformation, and
                cloud modernisation across FinTech and regulated industries.
              </p>
              <p>
                My background spans enterprise architecture, cloud migration (AWS, GCP, Azure), AI
                implementation (RAG, LangGraph, MCP), and infrastructure automation — always with a
                focus on business outcomes rather than technical outputs.
              </p>
              <p>{profile.philosophy}</p>
            </div>
          </div>
        </div>
      </Section>

      <Section background="surface">
        <h2 className="text-2xl font-bold text-foreground">Leadership style</h2>
        <p className="mt-6 max-w-3xl leading-relaxed text-muted">{profile.leadership}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href={social.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-brand hover:text-brand"
          >
            LinkedIn →
          </a>
          <a
            href={social.credly}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-brand hover:text-brand"
          >
            Credly →
          </a>
        </div>
      </Section>

      <Section background="white">
        <h2 className="mb-10 text-2xl font-bold text-foreground">My principles</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {principles.map((pillar) => (
            <div key={pillar.title} className="border-l-2 border-brand pl-6">
              <h3 className="text-lg font-semibold text-foreground">{pillar.title}</h3>
              <p className="mt-2 leading-relaxed text-muted">{pillar.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section background="surface">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Education</h2>
            <Card hover={false} className="mt-6">
              <p className="font-semibold text-foreground">{profile.education.degree}</p>
              <p className="mt-1 text-sm text-muted">
                {profile.education.institution} · {profile.education.year}
              </p>
            </Card>
          </div>
          <div>
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl font-bold text-foreground">Certifications</h2>
              <a
                href={social.credly}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-brand hover:text-brand-dark"
              >
                View on Credly →
              </a>
            </div>
            <ul className="mt-6 space-y-3">
              {certifications.map((cert) => (
                <li key={cert.name}>
                  <Card className="!p-4" hover={false}>
                    <p className="text-sm font-semibold text-foreground">{cert.name}</p>
                    <p className="mt-0.5 text-xs text-muted">{cert.issuer}</p>
                  </Card>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      <CTABand
        title="Want to know more?"
        description="Explore my experience timeline or view featured projects."
        buttonLabel="View Experience"
        buttonHref="/experience"
      />
    </>
  );
}
