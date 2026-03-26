import { Image, Users, Compass, User } from "lucide-react";
import type { Tab } from "@/pages/Home";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  activeTab: Tab;
  onChange: (tab: Tab) => void;
}

export function BottomNav({ activeTab, onChange }: BottomNavProps) {
  const tabs = [
    { id: "moments", icon: Image, label: "Moments" },
    { id: "contacts", icon: Users, label: "Contacten" },
    { id: "discover", icon: Compass, label: "Ontdekken" },
    { id: "ges", icon: User, label: "Profiel" },
  ] as const;

  return (
    <nav className="absolute bottom-0 left-0 right-0 bg-background/80 backdrop-blur-xl border-t border-border/50 pb-safe z-50 lg:hidden">
      <div className="flex justify-around items-center h-16 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              data-testid={`nav-${tab.id}`}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full space-y-1 transition-all duration-200",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className={cn(
                "relative transition-transform duration-300",
                isActive ? "scale-110" : "scale-100"
              )}>
                <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
                {tab.id === "moments" && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium tracking-wide">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}