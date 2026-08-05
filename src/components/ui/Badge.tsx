type BadgeProps = {
  children: React.ReactNode;
  variant?: "default" | "brand" | "outline";
};

const variants = {
  default: "bg-surface text-foreground",
  brand: "bg-brand-light text-brand",
  outline: "bg-surface-elevated border border-border text-foreground",
};

export default function Badge({ children, variant = "default" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${variants[variant]}`}
    >
      {children}
    </span>
  );
}
