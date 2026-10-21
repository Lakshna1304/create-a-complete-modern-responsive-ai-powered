import { PageHeader } from "@/components/layout/PageHeader";
import { useMySettings, useSetSelectedModule } from "@/hooks/useQueries";
import { describeThrown } from "@/lib/ai-errors";
import { cn } from "@/lib/utils";
import { MODULE_LIST, type ModuleMeta } from "@/types";
import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { useState } from "react";

/**
 * The adaptive AI core: the entry point that asks which kind of support the
 * visitor needs and routes them to the matching module. The previously chosen
 * pathway is highlighted from the caller's saved settings.
 */
export default function AiCorePage() {
  const navigate = useNavigate();
  const settings = useMySettings();
  const setSelectedModule = useSetSelectedModule();
  const [saveError, setSaveError] = useState<string | null>(null);

  const savedModule = settings.data?.selectedModule;

  function choose(meta: ModuleMeta) {
    setSaveError(null);
    // Record the choice, then navigate immediately. A failed save must never
    // block the visitor from reaching the module they picked.
    setSelectedModule.mutate(meta.id, {
      onError: (thrown) => setSaveError(describeThrown(thrown)),
    });
    void navigate({ to: meta.route });
  }

  return (
    <div data-ocid="page.ai_core">
      <PageHeader
        eyebrow="Adaptive AI core"
        title="Access, on your terms."
        description="Choose the support that fits you. Each pathway opens a focused set of tools."
      />

      {settings.isLoading && (
        <p
          className="mb-4 flex items-center gap-2 text-sm text-muted-foreground"
          data-ocid="ai_core.loading_state"
        >
          <Loader2
            aria-hidden="true"
            className="size-4 animate-spin motion-reduce:animate-none"
          />
          Loading your saved pathway…
        </p>
      )}

      {saveError && (
        <div
          role="alert"
          data-ocid="ai_core.error_state"
          className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive-foreground"
        >
          We could not save your choice, but you can keep using the module.{" "}
          {saveError}
        </div>
      )}

      <ul
        className="grid gap-4 sm:grid-cols-2"
        data-ocid="ai_core.module_list"
        aria-label="Assistance pathways"
      >
        {MODULE_LIST.map((meta, index) => {
          const isSaved = savedModule === meta.id;
          return (
            <li key={meta.id}>
              <button
                type="button"
                onClick={() => choose(meta)}
                aria-label={`${meta.title} — pathway ${meta.index}`}
                aria-current={isSaved ? "true" : undefined}
                data-ocid={`ai_core.module_card.${index + 1}`}
                className={cn(
                  "group flex h-full w-full flex-col gap-3 rounded-xl border bg-card p-5 text-left transition-smooth hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-elevated focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
                  isSaved ? "border-primary shadow-subtle" : "border-border",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <span
                    className={cn(
                      "flex size-11 shrink-0 items-center justify-center rounded-full font-display text-sm font-bold",
                      meta.badgeClass,
                    )}
                    aria-hidden="true"
                  >
                    {meta.index}
                  </span>
                  {isSaved && (
                    <span
                      className="flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-1 text-[0.625rem] font-semibold uppercase tracking-wider text-primary"
                      data-ocid={`ai_core.saved_badge.${index + 1}`}
                    >
                      <Check aria-hidden="true" className="size-3" />
                      Your pathway
                    </span>
                  )}
                </div>

                <div className="min-w-0">
                  <p
                    className={cn(
                      "text-[0.625rem] font-semibold uppercase tracking-[0.18em]",
                      meta.accentClass,
                    )}
                  >
                    {meta.label}
                  </p>
                  <h2 className="mt-1 font-display text-lg font-bold tracking-tight">
                    {meta.title}
                  </h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {meta.description}
                  </p>
                </div>

                <span className="mt-auto flex items-center gap-1.5 text-sm font-medium text-primary">
                  Open pathway
                  <ArrowRight
                    aria-hidden="true"
                    className="size-4 transition-transform group-hover:translate-x-0.5"
                  />
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
