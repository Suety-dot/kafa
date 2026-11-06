import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({ className, tone = "default", ...props }: React.HTMLAttributes<HTMLSpanElement> & { tone?: "default" | "accent" | "warn" | "ok" }) {
  const tones = {
    default: "bg-muted text-muted-foreground",
    accent: "bg-accent text-accent-foreground",
    warn: "bg-warn-bg text-warn-fg",
    ok: "bg-ok-bg text-ok-fg",
  };
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", tones[tone], className)} {...props} />;
}
