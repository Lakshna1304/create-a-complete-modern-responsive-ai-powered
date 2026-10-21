import { cn } from "@/lib/utils";
import { TEXT_SIZE_STEPS } from "@/types";
import { Contrast, Type } from "lucide-react";
import { useAccessibility } from "./AccessibilityProvider";

/**
 * Global accessibility controls: high-contrast toggle and a four-step text
 * size control. Applied app-wide and persisted across sessions.
 */
export function AccessibilityControls({
  compact = false,
}: { compact?: boolean }) {
  const { highContrast, setHighContrast, textScale, setTextScale } =
    useAccessibility();

  return (
    <section
      aria-label="Accessibility settings"
      data-ocid="accessibility.panel"
      className={cn(
        "rounded-xl border border-border bg-card p-4",
        compact ? "space-y-3" : "space-y-4",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Contrast aria-hidden="true" className="size-4 text-primary" />
          <span className="text-sm font-medium">High contrast</span>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={highContrast}
          aria-label="Toggle high contrast mode"
          onClick={() => setHighContrast(!highContrast)}
          data-ocid="accessibility.high_contrast_toggle"
          className={cn(
            "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-smooth focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
            highContrast
              ? "border-primary bg-primary"
              : "border-input bg-muted",
          )}
        >
          <span
            className={cn(
              "inline-block size-4 rounded-full bg-background transition-transform",
              highContrast ? "translate-x-6" : "translate-x-1",
            )}
          />
        </button>
      </div>

      <fieldset className="space-y-2">
        <legend className="flex items-center gap-2">
          <Type aria-hidden="true" className="size-4 text-primary" />
          <span className="text-sm font-medium">Text size</span>
        </legend>
        <div className="grid grid-cols-4 gap-1.5">
          {TEXT_SIZE_STEPS.map((step) => {
            const active = textScale === step.scale;
            return (
              <button
                key={step.value}
                type="button"
                aria-pressed={active}
                aria-label={step.label}
                onClick={() => setTextScale(step.scale)}
                data-ocid={`accessibility.text_size.${step.scale}`}
                className={cn(
                  "flex min-h-11 items-center justify-center rounded-lg border text-xs font-semibold transition-smooth focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
                  active
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border bg-secondary/40 text-muted-foreground hover:text-foreground",
                )}
              >
                {step.label}
              </button>
            );
          })}
        </div>
      </fieldset>
    </section>
  );
}
