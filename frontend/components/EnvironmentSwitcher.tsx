"use client";

import { cn } from "@/lib/utils";

type Environment = "Development" | "Staging" | "Production";

interface EnvironmentSwitcherProps {
  activeEnv: Environment;
  onEnvChange: (env: Environment) => void;
}

const environments: Environment[] = ["Development", "Staging", "Production"];

export function EnvironmentSwitcher({ activeEnv, onEnvChange }: EnvironmentSwitcherProps) {
  return (
    <div className="flex bg-black/40 backdrop-blur-md p-1 rounded-xl border border-white/10 w-fit">
      {environments.map((env) => (
        <button
          key={env}
          onClick={() => onEnvChange(env)}
          className={cn(
            "px-5 py-2 text-sm font-medium rounded-lg transition-all duration-200",
            activeEnv === env
              ? "bg-white/10 text-white shadow-sm ring-1 ring-white/10"
              : "text-muted-foreground hover:text-white hover:bg-white/5"
          )}
        >
          {env}
        </button>
      ))}
    </div>
  );
}
