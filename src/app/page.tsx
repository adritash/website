import type { Metadata } from "next";
import Link from "next/link";
import DataFlowBanner from "@/components/sections/DataFlowBanner";
import ProjectCard from "@/components/sections/ProjectCard";
import AnimatedStat from "@/components/ui/AnimatedStat";
import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import ProfilePhoto from "@/components/ui/ProfilePhoto";
import Section from "@/components/ui/Section";
import SectionHeader from "@/components/ui/SectionHeader";
import Badge from "@/components/ui/Badge";
import { getAllPosts } from "@/lib/content/posts";
import { profile, principles, stats } from "@/lib/data/profile";
import { projects } from "@/lib/data/projects";
import { skillCategories } from "@/lib/data/skills";
import { createPageMetadata } from "@/lib/metadata";
import Wordmark from "@/components/ui/Wordmark";
import { assets, siteConfig } from "@/lib/site";

export const metadata: Metadata = createPageMetadata({
  title: "Home",
  description: profile.summary,
  path: "/",
});

export default async function HomePage() {
  const blogPosts = (await getAllPosts()).slice(0, 2);
  const featuredProjects = projects.slice(0, 2);
  const previewSkills = skillCategories.slice(0, 4);

  return (
    <>
      <section className="relative overflow-hidden border-b border-white/10 bg-ink text-white">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(232,185,126,0.30),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(175,132,86,0.12),transparent_50%)]"
          aria-hidden="true"
        />
        <Container className="relative py-10 sm:py-12 lg:py-16">
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[1fr_auto] lg:gap-12">
            <div>
              <h1 className="flex flex-col items-start gap-3">
                <span className="sr-only">{siteConfig.brand}: {siteConfig.tagline}</span>
                <span aria-hidden="true">
                  <Wordmark className="text-4xl sm:text-5xl lg:text-6xl" />
                </span>
              </h1>
              <p className="mt-6 flex items-center gap-3 text-lg font-medium text-champagne sm:text-xl">
                <span className="h-px w-10 shrink-0 bg-gradient-to-r from-transparent to-gold" aria-hidden="true" />
                {siteConfig.tagline}
              </p>
              <p className="mt-2 text-sm font-medium text-white/60">
                {profile.location} · Founded by {profile.name}, {profile.role}
              </p>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-white/75">
                {profile.tagline}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button href="/contact" size="lg" variant="gold">
                  Book a call
                </Button>
                <Button href="/projects" size="lg" variant="outline-light">
                  View our work
                </Button>
                <Button href={assets.resumePdf} download={assets.resumeFilename} size="lg" variant="outline-light">
                  Founder resume
                </Button>
              </div>
            </div>
            <div className="flex justify-center lg:justify-end">
              <ProfilePhoto size="lg" priority />
            </div>
          </div>
        </Container>
      </section>

      <Section background="surface" className="py-12 sm:py-16">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <AnimatedStat
              key={stat.label}
              value={stat.value}
              suffix={stat.suffix}
              prefix={"prefix" in stat ? stat.prefix : ""}
              label={stat.label}
              delay={i * 100}
            />
          ))}
        </div>
      </Section>

      <DataFlowBanner />

      <Section background="white">
        <SectionHeader
          eyebrow="Featured Work"
          title="Programmes I've led"
          description="Real enterprise outcomes across cloud, AI, and infrastructure."
        />
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {featuredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} featured />
          ))}
        </div>
        <div className="mt-10 text-center">
          <Button href="/projects" variant="secondary">
            View all projects →
          </Button>
        </div>
      </Section>

      <Section background="surface">
        <SectionHeader
          eyebrow="Expertise"
          title="What I bring to the table"
          description="Categorised skills across architecture, cloud, AI, and delivery leadership."
        />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {previewSkills.map((cat) => (
            <div
              key={cat.id}
              className="rounded-2xl border border-border bg-surface-elevated p-6 shadow-sm"
            >
              <h3 className="font-semibold text-foreground">{cat.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {cat.description}
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {cat.skills.slice(0, 4).map((s) => (
                  <Badge key={s} variant="brand">
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Button href="/skills" variant="secondary">
            View all skills →
          </Button>
        </div>
      </Section>

      <Section background="white">
        <SectionHeader eyebrow="How I Work" title="Principles that guide my work" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {principles.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-border bg-surface p-6"
            >
              <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{item.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section background="surface">
        <SectionHeader
          eyebrow="Insights"
          title="Latest writing"
          description="Technical articles on architecture, cloud, and AI."
        />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {blogPosts.map((post) => (
            <article
              key={post.slug}
              className="rounded-2xl border border-border bg-surface-elevated p-6 shadow-sm transition-all hover:border-brand/40 hover:shadow-md"
            >
              <Badge variant="brand">{post.tag}</Badge>
              <h3 className="mt-3 text-lg font-semibold text-foreground">
                <Link href={`/insights/${post.slug}`} className="hover:text-brand">
                  {post.title}
                </Link>
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{post.excerpt}</p>
              <Link
                href={`/insights/${post.slug}`}
                className="mt-4 inline-block text-sm font-semibold text-brand hover:text-brand-dark"
              >
                Read article →
              </Link>
            </article>
          ))}
        </div>
      </Section>

      <section className="border-t border-border bg-surface-dark py-16 sm:py-20">
        <Container className="text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Let&apos;s connect
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-white/90">
            Open to senior architecture, programme leadership, and consulting roles.
            Happy to start with a conversation.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button href="/contact" variant="inverse" size="lg">
              Get in Touch
            </Button>
            <Button
              href="/resume"
              variant="ghost"
              size="lg"
              className="border-white/40 text-white hover:border-white hover:text-white"
            >
              View Resume
            </Button>
          </div>
        </Container>
      </section>
    </>
  );
}
