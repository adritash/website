import ToolSidebar from "@/components/pm/ToolSidebar";

/** One shared app shell (sidebar + content) for every PM tool. */
export default function PmToolsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell bg-ink text-white lg:grid lg:grid-cols-[14rem_minmax(0,1fr)]">
      <ToolSidebar />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
