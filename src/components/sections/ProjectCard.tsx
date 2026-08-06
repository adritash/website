import Badge from "@/components/ui/Badge";
import type { Project } from "@/lib/data/projects";

type ProjectCardProps = {
  project: Project;
  featured?: boolean;
};

export default function ProjectCard({ project, featured = false }: ProjectCardProps) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface-elevated shadow-sm transition-all hover:border-brand/40 hover:shadow-md">
      <div className="border-b border-border bg-surface px-6 py-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand">
          {project.industry}
        </p>
        <h3 className={`mt-2 font-semibold text-foreground ${featured ? "text-xl" : "text-lg"}`}>
          {project.title}
        </h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {project.tags.map((tag) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-5 p-6">
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-widest text-muted">
            Problem
          </h4>
          <p className="mt-2 text-sm leading-relaxed text-muted">{project.problem}</p>
        </div>
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-widest text-muted">
            Solution
          </h4>
          <p className="mt-2 text-sm leading-relaxed text-muted">{project.solution}</p>
        </div>
        <div className="mt-auto rounded-xl border border-brand/20 bg-brand-light p-4 dark:border-brand/30 dark:bg-brand-light/50">
          <h4 className="text-xs font-semibold uppercase tracking-widest text-brand">
            Impact
          </h4>
          <p className="mt-2 text-sm font-medium leading-relaxed text-foreground">
            {project.impact}
          </p>
        </div>
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-widest text-muted">
            Technologies
          </h4>
          <div className="mt-2 flex flex-wrap gap-2">
            {project.tech.map((t) => (
              <Badge key={t} variant="brand">
                {t}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}
