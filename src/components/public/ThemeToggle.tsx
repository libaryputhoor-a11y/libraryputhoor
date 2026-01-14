import { useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun, Monitor, Palette } from "lucide-react";
import { cn } from "@/lib/utils";

const ThemeToggle = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  const themes = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "Default", icon: Monitor },
  ];

  return (
    <div className="fixed right-0 top-1/2 -translate-y-1/2 z-50">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center justify-center w-10 h-10 bg-primary text-primary-foreground rounded-l-lg shadow-lg transition-all duration-300 hover:w-12",
          isOpen && "bg-primary/90"
        )}
        aria-label="Toggle theme menu"
      >
        <Palette className="h-5 w-5" />
      </button>

      {/* Popup Panel */}
      <div
        className={cn(
          "absolute right-0 top-1/2 -translate-y-1/2 bg-card border border-border rounded-l-lg shadow-xl transition-all duration-300 overflow-hidden",
          isOpen ? "w-36 opacity-100 translate-x-0" : "w-0 opacity-0 translate-x-full"
        )}
      >
        <div className="p-3 space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-2">
            Appearance
          </p>
          {themes.map((t) => {
            const Icon = t.icon;
            const isActive = theme === t.value;
            return (
              <button
                key={t.value}
                onClick={() => {
                  setTheme(t.value);
                  setIsOpen(false);
                }}
                className={cn(
                  "flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ThemeToggle;
