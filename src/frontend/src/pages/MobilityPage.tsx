import { AssistantPanel } from "@/components/assistant/AssistantPanel";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  CORE_NAV,
  MODULE_NAV,
  type NavItem,
} from "@/components/layout/nav-config";
import { useGenerateSteps } from "@/hooks/useQueries";
import { useSpeechRecognition, useSpeechSynthesis } from "@/hooks/useSpeech";
import { describeAiError, describeThrown } from "@/lib/ai-errors";
import { cn } from "@/lib/utils";
import { useNavigate } from "@tanstack/react-router";
import {
  Accessibility,
  AlertCircle,
  ArrowRight,
  Check,
  Compass,
  ListOrdered,
  Loader2,
  Mic,
  MicOff,
  RotateCcw,
  Sparkles,
  Volume2,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";

/* ------------------------------------------------------------------ */
/* Voice navigation                                                    */
/* ------------------------------------------------------------------ */

interface VoiceTarget {
  /** Spoken phrases that select this destination. */
  phrases: string[];
  to: string;
  label: string;
}

const VOICE_TARGETS: VoiceTarget[] = [
  {
    phrases: ["ai core", "home", "start", "main page"],
    to: CORE_NAV.to,
    label: CORE_NAV.label,
  },
  ...MODULE_NAV.map((item) => ({
    phrases: [item.label.toLowerCase(), item.to.replace("/", "")],
    to: item.to,
    label: item.label,
  })),
];

function matchTarget(spoken: string): VoiceTarget | null {
  const normalized = spoken.toLowerCase().trim();
  if (!normalized) return null;
  return (
    VOICE_TARGETS.find((target) =>
      target.phrases.some((phrase) => normalized.includes(phrase)),
    ) ?? null
  );
}

/** Large, keyboard-operable destination button with visible focus. */
function NavButton({
  item,
  onSelect,
}: {
  item: NavItem;
  onSelect: (to: string, label: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(item.to, item.label)}
      className="flex min-h-14 w-full items-center justify-between gap-3 rounded-xl border border-border bg-background/60 px-4 py-3 text-left transition-smooth hover:border-primary/60 hover:bg-primary/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      data-ocid={`mobility.nav_button.${item.to === "/" ? "core" : item.to.replace("/", "")}`}
    >
      <span className="flex items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Compass aria-hidden="true" className="size-4" />
        </span>
        <span className="font-display text-sm font-semibold">{item.label}</span>
      </span>
      <ArrowRight aria-hidden="true" className="size-4 text-muted-foreground" />
    </button>
  );
}

/** Voice-controlled navigation panel: speak a destination or tap a button. */
function VoiceNavigation() {
  const navigate = useNavigate();
  const tts = useSpeechSynthesis();
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const goTo = useCallback(
    (to: string, label: string) => {
      setError(null);
      setStatus(`Opening ${label}.`);
      tts.speak(`Opening ${label}.`);
      void navigate({ to });
    },
    [navigate, tts],
  );

  const speech = useSpeechRecognition((spoken) => {
    const target = matchTarget(spoken);
    if (target) {
      goTo(target.to, target.label);
    } else {
      setStatus(null);
      setError(
        `I did not recognise "${spoken}". Try saying a page name such as "Vision" or "AI core".`,
      );
    }
  });

  const destinations = useMemo(() => [CORE_NAV, ...MODULE_NAV], []);

  return (
    <section
      aria-labelledby="mobility-voice-title"
      data-ocid="mobility.voice_nav"
      className="flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-subtle"
    >
      <header className="flex items-start gap-3 border-b border-border px-4 py-3.5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent">
          <Mic aria-hidden="true" className="size-4" />
        </span>
        <div className="min-w-0">
          <h2
            id="mobility-voice-title"
            className="font-display text-sm font-semibold"
          >
            Voice navigation
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Say a page name to move there, or tap a destination below.
          </p>
        </div>
      </header>

      <div className="flex flex-col gap-4 px-4 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={speech.listening ? speech.stop : speech.start}
            aria-pressed={speech.listening}
            className={cn(
              "flex min-h-14 items-center gap-2.5 rounded-xl border px-5 text-sm font-semibold transition-smooth focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
              speech.listening
                ? "border-primary bg-primary/15 text-primary"
                : "border-border bg-background/60 text-foreground hover:border-primary/60 hover:bg-primary/10",
            )}
            data-ocid="mobility.voice_button"
          >
            {speech.listening ? (
              <MicOff aria-hidden="true" className="size-5" />
            ) : (
              <Mic aria-hidden="true" className="size-5" />
            )}
            {speech.listening ? "Stop listening" : "Start voice control"}
          </button>

          <button
            type="button"
            onClick={() =>
              tts.speak(
                "Mobility support. Say a page name such as Vision, Communication, Cognition, or AI core to move there.",
              )
            }
            className="flex min-h-14 items-center gap-2.5 rounded-xl border border-border bg-background/60 px-5 text-sm font-semibold transition-smooth hover:border-primary/60 hover:bg-primary/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            data-ocid="mobility.read_page_button"
          >
            <Volume2 aria-hidden="true" className="size-5" />
            Read this page aloud
          </button>
        </div>

        {speech.listening && (
          <p
            className="text-sm text-primary"
            data-ocid="mobility.listening_state"
          >
            Listening… {speech.transcript}
          </p>
        )}

        {status && !error && (
          <p
            className="flex items-center gap-2 text-sm text-success"
            data-ocid="mobility.success_state"
          >
            <Check aria-hidden="true" className="size-4" />
            {status}
          </p>
        )}

        {(error || speech.error || tts.error) && (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-sm text-destructive-foreground"
            data-ocid="mobility.error_state"
          >
            <span className="flex items-center gap-2">
              <AlertCircle aria-hidden="true" className="size-4 shrink-0" />
              {error ?? speech.error ?? tts.error}
            </span>
            {error && (
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  speech.reset();
                }}
                className="flex min-h-9 items-center gap-1.5 rounded-md border border-destructive/50 px-2.5 text-xs font-medium text-foreground transition-smooth hover:bg-destructive/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                data-ocid="mobility.retry_button"
              >
                <RotateCcw aria-hidden="true" className="size-3.5" />
                Try again
              </button>
            )}
          </div>
        )}

        <div
          className="grid gap-2.5 sm:grid-cols-2"
          data-ocid="mobility.nav_list"
        >
          {destinations.map((item) => (
            <NavButton key={item.to} item={item} onSelect={goTo} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Everyday digital task help                                          */
/* ------------------------------------------------------------------ */

type StepsStatus = "idle" | "loading" | "success" | "error";

/** Break an everyday digital task into spoken, ordered steps. */
function TaskHelp() {
  const generateSteps = useGenerateSteps();
  const tts = useSpeechSynthesis();
  const [task, setTask] = useState("");
  const [status, setStatus] = useState<StepsStatus>("idle");
  const [steps, setSteps] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastTask, setLastTask] = useState("");

  function run(input: string) {
    const trimmed = input.trim();
    if (!trimmed) return;
    setStatus("loading");
    setError(null);
    setSteps([]);
    setLastTask(trimmed);
    generateSteps.mutate(
      { task: trimmed },
      {
        onSuccess: (result) => {
          if (result.__kind__ === "ok") {
            setSteps(result.ok.steps);
            setStatus("success");
          } else {
            setError(describeAiError(result.err));
            setStatus("error");
          }
        },
        onError: (thrown) => {
          setError(describeThrown(thrown));
          setStatus("error");
        },
      },
    );
  }

  const isLoading = status === "loading";
  const isEmpty = task.trim().length === 0;

  return (
    <section
      aria-labelledby="mobility-task-title"
      data-ocid="mobility.task_help"
      className="flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-subtle"
    >
      <header className="flex items-start gap-3 border-b border-border px-4 py-3.5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <ListOrdered aria-hidden="true" className="size-4" />
        </span>
        <div className="min-w-0">
          <h2
            id="mobility-task-title"
            className="font-display text-sm font-semibold"
          >
            Everyday task help
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Describe a digital task and get clear steps you can follow or hear.
          </p>
        </div>
      </header>

      <form
        className="flex flex-col gap-3 px-4 py-4"
        onSubmit={(event) => {
          event.preventDefault();
          run(task);
        }}
      >
        <label
          htmlFor="mobility-task-input"
          className="text-xs font-medium text-muted-foreground"
        >
          What do you want to do?
        </label>
        <input
          id="mobility-task-input"
          type="text"
          value={task}
          onChange={(event) => setTask(event.target.value)}
          placeholder="e.g. Send a photo to my family, or pay a bill online…"
          className="min-h-12 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          data-ocid="mobility.task_input"
        />

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {isEmpty ? "Describe a task to continue." : "Ready when you are."}
          </p>
          <button
            type="submit"
            disabled={isEmpty || isLoading}
            className="flex min-h-12 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition-smooth hover:opacity-90 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            data-ocid="mobility.task_submit_button"
          >
            {isLoading ? (
              <Loader2
                aria-hidden="true"
                className="size-4 animate-spin motion-reduce:animate-none"
              />
            ) : (
              <Sparkles aria-hidden="true" className="size-4" />
            )}
            {isLoading ? "Working…" : "Get steps"}
          </button>
        </div>
      </form>

      <div className="border-t border-border px-4 py-4">
        {status === "idle" && (
          <p
            className="text-sm text-muted-foreground"
            data-ocid="mobility.task_empty_state"
          >
            Your step-by-step guide will appear here.
          </p>
        )}

        {status === "loading" && (
          <div
            className="flex items-center gap-2 text-sm text-muted-foreground"
            data-ocid="mobility.task_loading_state"
          >
            <Loader2
              aria-hidden="true"
              className="size-4 animate-spin motion-reduce:animate-none"
            />
            Building your steps…
          </div>
        )}

        {status === "error" && (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-sm text-destructive-foreground"
            data-ocid="mobility.task_error_state"
          >
            <span className="flex items-center gap-2">
              <AlertCircle aria-hidden="true" className="size-4 shrink-0" />
              {error}
            </span>
            <button
              type="button"
              onClick={() => run(lastTask)}
              className="flex min-h-9 items-center gap-1.5 rounded-md border border-destructive/50 px-2.5 text-xs font-medium text-foreground transition-smooth hover:bg-destructive/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              data-ocid="mobility.task_retry_button"
            >
              <RotateCcw aria-hidden="true" className="size-3.5" />
              Retry
            </button>
          </div>
        )}

        {status === "success" && (
          <div data-ocid="mobility.task_success_state">
            {steps.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No steps were produced. Try describing the task in a little more
                detail.
              </p>
            ) : (
              <>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-xs text-muted-foreground">
                    {steps.length} step{steps.length === 1 ? "" : "s"}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      tts.speak(
                        steps
                          .map((step, index) => `Step ${index + 1}. ${step}`)
                          .join(" "),
                      )
                    }
                    className="flex min-h-10 items-center gap-2 rounded-lg border border-border px-3 text-xs font-semibold transition-smooth hover:border-primary/60 hover:bg-primary/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                    data-ocid="mobility.task_read_aloud_button"
                  >
                    <Volume2 aria-hidden="true" className="size-4" />
                    Read steps aloud
                  </button>
                </div>
                <ol
                  className="space-y-2"
                  data-ocid="mobility.task_list"
                  aria-label="Ordered steps"
                >
                  {steps.map((step, index) => (
                    <li
                      key={`mobility-step-${index + 1}`}
                      data-ocid={`mobility.task_item.${index + 1}`}
                      className="flex gap-3 rounded-lg border border-border bg-background/60 p-3"
                    >
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                        {index + 1}
                      </span>
                      <span className="text-sm leading-relaxed text-foreground">
                        {step}
                      </span>
                    </li>
                  ))}
                </ol>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function MobilityPage() {
  return (
    <div data-ocid="page.mobility">
      <PageHeader
        eyebrow="Mobility"
        title="Mobility support"
        description="Get spoken guidance, hands-free controls, and help with everyday tasks."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex flex-col gap-6">
          <VoiceNavigation />
          <TaskHelp />
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-xl border border-border bg-card p-4 shadow-subtle">
            <h2 className="flex items-center gap-2 font-display text-sm font-semibold">
              <Accessibility
                aria-hidden="true"
                className="size-4 text-primary"
              />
              Hands-free tips
            </h2>
            <ul className="mt-3 space-y-2.5 text-xs text-muted-foreground">
              <li className="flex gap-2">
                <ArrowRight
                  aria-hidden="true"
                  className="mt-0.5 size-3.5 shrink-0 text-primary"
                />
                Start voice control, then say a page name such as “Vision” or
                “AI core”.
              </li>
              <li className="flex gap-2">
                <ArrowRight
                  aria-hidden="true"
                  className="mt-0.5 size-3.5 shrink-0 text-primary"
                />
                Use the assistant microphone below to ask questions without
                typing.
              </li>
              <li className="flex gap-2">
                <ArrowRight
                  aria-hidden="true"
                  className="mt-0.5 size-3.5 shrink-0 text-primary"
                />
                Every control is reachable with Tab and shows a visible focus
                ring.
              </li>
            </ul>
          </div>

          <div className="min-h-[26rem]">
            <AssistantPanel />
          </div>
        </aside>
      </div>
    </div>
  );
}
