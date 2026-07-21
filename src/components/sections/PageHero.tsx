interface PageHeroProps {
  title: string;
  subtitle: string;
}

export default function PageHero({ title, subtitle }: PageHeroProps) {
  return (
    <section className="bg-slate-900 py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <p className="text-indigo-400 text-sm font-semibold uppercase tracking-widest mb-4">
          {title}
        </p>
        <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight max-w-3xl">
          {subtitle}
        </h1>
      </div>
    </section>
  );
}
