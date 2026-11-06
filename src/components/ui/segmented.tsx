"use client";
import { cn } from "@/lib/utils";

/** Grupo de opciones tipo shadcn ToggleGroup, con radios reales para que funcione en formularios. */
export function Segmented<T extends string>({
  name,
  options,
  value,
  onChange,
  label,
}: {
  name: string;
  label: string;
  options: { value: T; label: string }[];
  value: T | "";
  onChange: (v: T) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="mb-1.5 text-sm font-medium">{label}</legend>
      <div className="grid gap-1 rounded-xl bg-muted p-1" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
        {options.map((o) => (
          <label
            key={o.value}
            className={cn(
              "flex h-10 cursor-pointer items-center justify-center rounded-lg px-1 text-center text-sm text-muted-foreground has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
              value === o.value && "border border-border bg-card font-semibold text-foreground shadow-sm",
            )}
          >
            <input type="radio" name={name} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} className="sr-only" />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
