import { AssistantPanel } from "@/components/assistant/AssistantPanel";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  useGenerateSteps,
  useSimplifyText,
  useSummarizeText,
} from "@/hooks/useQueries";
import { describeAiError, describeThrown } from "@/lib/ai-errors";
import {
  AlertCircle,
  ArrowRight,
  Check,
  Lightbulb,
  ListOrdered,
  Loader2,
  RotateCcw,
  Sparkles,
  Wand2,
} from "lucide-react";
import { type ReactNode, useState } from "react";

type ToolStatus = "idle" | "loading" | "success" | "error";

interface ToolState<T> {
  status: ToolStatus;
  data: T | null;
  error: string | null;
  lastInput: string;
}

function idleState<T>(): ToolState<T> {
  return { status: "idle", data: null, error: null, lastInput: "" };
}

/** Shared shell for one cognitive tool: input, action, and result zone. */
function ToolCard({
  ocid,
  icon,
  title,
  description,
  inputLabel,
  placeholder,
  actionLabel,
  value,
  onValueChange,
  onSubmit,
  status,
  error,
  onRetry,
  children,
  multiline = true,
}: {
  ocid: string;
  icon: ReactNode;
  title: string;
  description: string;
  inputLabel: string;
  placeholder: string;
  actionLabel: string;
  value: string;
  onValueChange: (next: string) => void;
  onSubmit: () => void;
  status: ToolStatus;
  error: string | null;
  onRetry: () => void;
  children: ReactNode;
  multiline?: boolean;
}) {
  const inputId = `${ocid}-input`;
  const isLoading = status === "loading";
  const isEmpty = value.trim().length === 0;

  return (
    <section
      aria-labelledby={`${ocid}-title`}
      data-ocid={ocid}
      className="flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-subtle"
    >
      <header className="flex items-start gap-3 border-b border-border px-4 py-3.5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
          {icon}
        </span>
        <div className="min-w-0">
          <h2
            id={`${ocid}-title`}
            className="font-display text-sm font-semibold"
          >
            {title}
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        </div>
      </header>

      <form
        className="flex flex-col gap-3 px-4 py-4"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <label
          htmlFor={inputId}
          className="text-xs font-medium text-muted-foreground"
        >
          {inputLabel}
        </label>
        {multiline ? (
          <textarea
            id={inputId}
            value={value}
            onChange={(event) => onValueChange(event.target.value)}
            rows={4}
            placeholder={placeholder}
            className="min-h-24 w-full resize-y rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            data-ocid={`${ocid}.textarea`}
          />
        ) : (
          <input
            id={inputId}
            type="text"
            value={value}
            onChange={(event) => onValueChange(event.target.value)}
            placeholder={placeholder}
            className="min-h-11 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            data-ocid={`${ocid}.input`}
          />
        )}

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {isEmpty ? "Enter some text to continue." : "Ready when you are."}
          </p>
          <button
            type="submit"
            disabled={isEmpty || isLoading}
            className="flex min-h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-smooth hover:opacity-90 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            data-ocid={`${ocid}.submit_button`}
          >
            {isLoading ? (
              <Loader2
                aria-hidden="true"
                className="size-4 animate-spin motion-reduce:animate-none"
              />
            ) : (
              <Sparkles aria-hidden="true" className="size-4" />
            )}
            {isLoading ? "Working…" : actionLabel}
          </button>
        </div>
      </form>

      <div className="border-t border-border px-4 py-4">
        {status === "idle" && (
          <p
            className="text-sm text-muted-foreground"
            data-ocid={`${ocid}.empty_state`}
          >
            Your result will appear here.
          </p>
        )}

        {status === "loading" && (
          <div
            className="flex items-center gap-2 text-sm text-muted-foreground"
            data-ocid={`${ocid}.loading_state`}
          >
            <Loader2
              aria-hidden="true"
              className="size-4 animate-spin motion-reduce:animate-none"
            />
            Generating your result…
          </div>
        )}

        {status === "error" && (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-sm text-destructive-foreground"
            data-ocid={`${ocid}.error_state`}
          >
            <span className="flex items-center gap-2">
              <AlertCircle aria-hidden="true" className="size-4 shrink-0" />
              {error}
            </span>
            <button
              type="button"
              onClick={onRetry}
              className="flex min-h-9 items-center gap-1.5 rounded-md border border-destructive/50 px-2.5 text-xs font-medium text-foreground transition-smooth hover:bg-destructive/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              data-ocid={`${ocid}.retry_button`}
            >
              <RotateCcw aria-hidden="true" className="size-3.5" />
              Retry
            </button>
          </div>
        )}

        {status === "success" && (
          <div data-ocid={`${ocid}.success_state`}>{children}</div>
        )}
      </div>
    </section>
  );
}

/** Text simplification tool. */
function SimplifyTool() {
  const simplify = useSimplifyText();
  const [text, setText] = useState("");
  const [state, setState] = useState<ToolState<string>>(idleState<string>());

  function run(input: string) {
    const trimmed = input.trim();
    if (!trimmed) return;
    setState({
      status: "loading",
      data: null,
      error: null,
      lastInput: trimmed,
    });
    simplify.mutate(
      { text: trimmed },
      {
        onSuccess: (result) => {
          if (result.__kind__ === "ok") {
            setState({
              status: "success",
              data: result.ok,
              error: null,
              lastInput: trimmed,
            });
          } else {
            setState({
              status: "error",
              data: null,
              error: describeAiError(result.err),
              lastInput: trimmed,
            });
          }
        },
        onError: (thrown) => {
          setState({
            status: "error",
            data: null,
            error: describeThrown(thrown),
            lastInput: trimmed,
          });
        },
      },
    );
  }

  return (
    <ToolCard
      ocid="cognition.simplify"
      icon={<Wand2 aria-hidden="true" className="size-4" />}
      title="Simplify text"
      description="Rewrite dense text in easier, everyday language."
      inputLabel="Text to simplify"
      placeholder="Paste a paragraph, letter, or article you want made simpler…"
      actionLabel="Simplify"
      value={text}
      onValueChange={setText}
      onSubmit={() => run(text)}
      status={state.status}
      error={state.error}
      onRetry={() => run(state.lastInput)}
    >
      <div className="rounded-lg border border-border bg-background/60 p-3.5">
        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground">
          {state.data}
        </p>
      </div>
    </ToolCard>
  );
}

/** Summarization tool. */
function SummarizeTool() {
  const summarize = useSummarizeText();
  const [text, setText] = useState("");
  const [state, setState] = useState<ToolState<string[]>>(
    idleState<string[]>(),
  );

  function run(input: string) {
    const trimmed = input.trim();
    if (!trimmed) return;
    setState({
      status: "loading",
      data: null,
      error: null,
      lastInput: trimmed,
    });
    summarize.mutate(
      { text: trimmed },
      {
        onSuccess: (result) => {
          if (result.__kind__ === "ok") {
            setState({
              status: "success",
              data: result.ok.keyPoints,
              error: null,
              lastInput: trimmed,
            });
          } else {
            setState({
              status: "error",
              data: null,
              error: describeAiError(result.err),
              lastInput: trimmed,
            });
          }
        },
        onError: (thrown) => {
          setState({
            status: "error",
            data: null,
            error: describeThrown(thrown),
            lastInput: trimmed,
          });
        },
      },
    );
  }

  const points = state.data ?? [];

  return (
    <ToolCard
      ocid="cognition.summarize"
      icon={<Lightbulb aria-hidden="true" className="size-4" />}
      title="Summarize text"
      description="Pull out the key points from a longer passage."
      inputLabel="Text to summarize"
      placeholder="Paste the text you want condensed into key points…"
      actionLabel="Summarize"
      value={text}
      onValueChange={setText}
      onSubmit={() => run(text)}
      status={state.status}
      error={state.error}
      onRetry={() => run(state.lastInput)}
    >
      {points.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No key points were found in that text. Try a longer passage.
        </p>
      ) : (
        <ul
          className="space-y-2"
          data-ocid="cognition.summarize.list"
          aria-label="Key points"
        >
          {points.map((point, index) => (
            <li
              key={`key-point-${index + 1}`}
              data-ocid={`cognition.summarize.item.${index + 1}`}
              className="flex gap-2.5 rounded-lg border border-border bg-background/60 p-3"
            >
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[0.625rem] font-semibold text-primary">
                {index + 1}
              </span>
              <span className="text-sm leading-relaxed text-foreground">
                {point}
              </span>
            </li>
          ))}
        </ul>
      )}
    </ToolCard>
  );
}

/** Step-by-step instruction tool. */
function StepsTool() {
  const generateSteps = useGenerateSteps();
  const [task, setTask] = useState("");
  const [state, setState] = useState<ToolState<string[]>>(
    idleState<string[]>(),
  );

  function run(input: string) {
    const trimmed = input.trim();
    if (!trimmed) return;
    setState({
      status: "loading",
      data: null,
      error: null,
      lastInput: trimmed,
    });
    generateSteps.mutate(
      { task: trimmed },
      {
        onSuccess: (result) => {
          if (result.__kind__ === "ok") {
            setState({
              status: "success",
              data: result.ok.steps,
              error: null,
              lastInput: trimmed,
            });
          } else {
            setState({
              status: "error",
              data: null,
              error: describeAiError(result.err),
              lastInput: trimmed,
            });
          }
        },
        onError: (thrown) => {
          setState({
            status: "error",
            data: null,
            error: describeThrown(thrown),
            lastInput: trimmed,
          });
        },
      },
    );
  }

  const steps = state.data ?? [];

  return (
    <ToolCard
      ocid="cognition.steps"
      icon={<ListOrdered aria-hidden="true" className="size-4" />}
      title="Step-by-step instructions"
      description="Turn a task into clear, ordered steps you can follow."
      inputLabel="Task to break down"
      placeholder="e.g. Set up a new phone, or pay a bill online…"
      actionLabel="Generate steps"
      value={task}
      onValueChange={setTask}
      onSubmit={() => run(task)}
      status={state.status}
      error={state.error}
      onRetry={() => run(state.lastInput)}
      multiline={false}
    >
      {steps.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No steps were produced. Try describing the task in a little more
          detail.
        </p>
      ) : (
        <ol
          className="space-y-2"
          data-ocid="cognition.steps.list"
          aria-label="Ordered steps"
        >
          {steps.map((step, index) => (
            <li
              key={`step-${index + 1}`}
              data-ocid={`cognition.steps.item.${index + 1}`}
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
      )}
    </ToolCard>
  );
}

export default function CognitivePage() {
  return (
    <div data-ocid="page.cognition">
      <PageHeader
        eyebrow="Cognition"
        title="Cognitive support"
        description="Break down complex ideas and turn long text into key points."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex flex-col gap-6">
          <SimplifyTool />
          <SummarizeTool />
          <StepsTool />
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-xl border border-border bg-card p-4 shadow-subtle">
            <h2 className="flex items-center gap-2 font-display text-sm font-semibold">
              <Check aria-hidden="true" className="size-4 text-primary" />
              How these tools help
            </h2>
            <ul className="mt-3 space-y-2.5 text-xs text-muted-foreground">
              <li className="flex gap-2">
                <ArrowRight
                  aria-hidden="true"
                  className="mt-0.5 size-3.5 shrink-0 text-primary"
                />
                Simplify rewrites hard text so it is easier to read and follow.
              </li>
              <li className="flex gap-2">
                <ArrowRight
                  aria-hidden="true"
                  className="mt-0.5 size-3.5 shrink-0 text-primary"
                />
                Summarize lists the most important points from a long passage.
              </li>
              <li className="flex gap-2">
                <ArrowRight
                  aria-hidden="true"
                  className="mt-0.5 size-3.5 shrink-0 text-primary"
                />
                Steps turns a task into an ordered checklist you can work
                through.
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
