import { Image, Users, Compass, User } from "lucide-react";
import type { Tab } from "@/pages/Home";
import { cn } from "@/lib/utils";

interface SideNavProps {
  activeTab: Tab;
  onChange: (tab: Tab) => void;
}

export function SideNav({ activeTab, onChange }: SideNavProps) {
  const tabs = [
    { id: "moments", icon: Image, label: "Moments" },
    { id: "contacts", icon: Users, label: "Contacten" },
    { id: "discover", icon: Compass, label: "Ontdekken" },
    { id: "ges", icon: User, label: "Profiel" },
  ] as const;

  return (
    <nav className="hidden lg:flex flex-col w-64 bg-background border-r border-border/50 h-full shrink-0" data-testid="side-nav">
      <div className="px-5 py-6 border-b border-border/30">
        <h1 className="text-2xl font-bold tracking-tight text-primary font-heading">W€spr</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Jouw Europese super app</p>
      </div>

      <div className="flex flex-col gap-1 p-3 flex-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              data-testid={`sidenav-${tab.id}`}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 w-full",
                isActive
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <div className="relative">
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                {tab.id === "moments" && (
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                  </span>
                )}
              </div>
              <span className="text-[14px]">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
