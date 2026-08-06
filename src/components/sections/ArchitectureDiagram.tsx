import type { ArchitectureLayer } from "@/lib/data/architectures";
import Badge from "@/components/ui/Badge";

type ArchitectureDiagramProps = {
  layers: ArchitectureLayer[];
};

function LayerArrow() {
  return (
    <div className="flex justify-center py-1" aria-hidden="true">
      <svg
        className="h-6 w-6 text-muted"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
      </svg>
    </div>
  );
}

export default function ArchitectureDiagram({ layers }: ArchitectureDiagramProps) {
  return (
    <div className="space-y-0">
      {layers.map((layer, index) => (
        <div key={layer.id}>
          <div className="rounded-xl border border-border bg-surface p-4 sm:p-5">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-brand">
              {layer.name}
            </h4>
            <div className="mt-3 flex flex-wrap gap-2">
              {layer.services.map((service) => (
                <span
                  key={service.name}
                  title={service.description}
                  className="group relative"
                >
                  <Badge variant="outline">{service.name}</Badge>
                </span>
              ))}
            </div>
            <ul className="mt-3 space-y-1.5 border-t border-border pt-3">
              {layer.services.map((service) => (
                <li key={`${layer.id}-${service.name}`} className="text-xs text-muted">
                  <span className="font-medium text-foreground">{service.name}</span>
                  {" — "}
                  {service.description}
                </li>
              ))}
            </ul>
          </div>
          {index < layers.length - 1 && <LayerArrow />}
        </div>
      ))}
    </div>
  );
}
