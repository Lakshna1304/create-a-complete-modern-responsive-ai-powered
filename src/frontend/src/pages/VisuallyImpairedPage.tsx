import { ExternalBlob, createActor } from "@/backend";
import { AssistantPanel } from "@/components/assistant/AssistantPanel";
import { PageHeader } from "@/components/layout/PageHeader";
import { Progress } from "@/components/ui/progress";
import { useDescribeImage } from "@/hooks/useQueries";
import { useSpeechRecognition, useSpeechSynthesis } from "@/hooks/useSpeech";
import { describeAiError, describeThrown } from "@/lib/ai-errors";
import { cn } from "@/lib/utils";
import { useActor } from "@caffeineai/core-infrastructure";
import {
  AlertCircle,
  Check,
  FileImage,
  ImagePlus,
  Loader2,
  Mic,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Square,
  Volume2,
  X,
} from "lucide-react";
import { type ChangeEvent, type DragEvent, useRef, useState } from "react";

type DescribeStatus = "idle" | "uploading" | "describing" | "success" | "error";

interface DescribeResult {
  description: string;
  readableText: string;
}

const MAX_BYTES = 10 * 1024 * 1024;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Read-aloud controls shared by the description and readable-text blocks. */
function ReadAloudControls({
  ocid,
  text,
  tts,
}: {
  ocid: string;
  text: string;
  tts: ReturnType<typeof useSpeechSynthesis>;
}) {
  if (!tts.supported) {
    return (
      <p
        className="text-xs text-muted-foreground"
        data-ocid={`${ocid}.unsupported_state`}
      >
        Read-aloud is not supported in this browser.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => tts.speak(text)}
        disabled={!text.trim()}
        className="flex min-h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-medium text-foreground transition-smooth hover:bg-accent/10 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        data-ocid={`${ocid}.read_aloud_button`}
      >
        <Volume2 aria-hidden="true" className="size-3.5" />
        Read aloud
      </button>
      {tts.speaking && (
        <>
          <button
            type="button"
            onClick={tts.paused ? tts.resume : tts.pause}
            className="flex min-h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-medium text-foreground transition-smooth hover:bg-accent/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            data-ocid={`${ocid}.tts_pause_button`}
          >
            {tts.paused ? (
              <Play aria-hidden="true" className="size-3.5" />
            ) : (
              <Pause aria-hidden="true" className="size-3.5" />
            )}
            {tts.paused ? "Resume" : "Pause"}
          </button>
          <button
            type="button"
            onClick={tts.stop}
            className="flex min-h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-medium text-foreground transition-smooth hover:bg-accent/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            data-ocid={`${ocid}.tts_stop_button`}
          >
            <Square aria-hidden="true" className="size-3" />
            Stop
          </button>
        </>
      )}
    </div>
  );
}

/** Image upload + describe workflow for the vision pathway. */
function ImageDescribeCard() {
  const { actor } = useActor(createActor);
  const describeImage = useDescribeImage();
  const tts = useSpeechSynthesis();

  const [file, setFile] = useState<File | null>(null);
  const [context, setContext] = useState("");
  const [status, setStatus] = useState<DescribeStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<DescribeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const speech = useSpeechRecognition((text) => {
    setContext((current) => (current ? `${current} ${text}` : text));
  });

  const busy = status === "uploading" || status === "describing";

  function chooseFile(next: File | null) {
    if (!next) return;
    if (!next.type.startsWith("image/")) {
      setError("Please choose an image file (PNG, JPEG, GIF or WebP).");
      setStatus("error");
      return;
    }
    if (next.size > MAX_BYTES) {
      setError(
        `That image is too large. The limit is ${formatBytes(MAX_BYTES)}.`,
      );
      setStatus("error");
      return;
    }
    setFile(next);
    setResult(null);
    setError(null);
    setStatus("idle");
    setProgress(0);
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    chooseFile(event.target.files?.[0] ?? null);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    chooseFile(event.dataTransfer.files?.[0] ?? null);
  }

  function clearFile() {
    setFile(null);
    setResult(null);
    setError(null);
    setStatus("idle");
    setProgress(0);
    if (inputRef.current) inputRef.current.value = "";
  }

  function run() {
    if (!file || busy) return;
    if (!actor) {
      setError(
        "The assistant is still connecting. Please try again in a moment.",
      );
      setStatus("error");
      return;
    }
    setError(null);
    setResult(null);
    setProgress(0);
    setStatus("uploading");

    void (async () => {
      try {
        const bytes = new Uint8Array(await file.arrayBuffer());
        const blob = ExternalBlob.fromBytes(
          bytes,
          file.type || "application/octet-stream",
          file.name,
        ).withUploadProgress((percentage) => setProgress(percentage));

        const upload = await actor.uploadImage(file.name, blob);
        if (upload.__kind__ === "err") {
          setError(describeAiError(upload.err));
          setStatus("error");
          return;
        }

        setStatus("describing");
        const trimmedContext = context.trim();
        const described = await describeImage.mutateAsync({
          imageId: upload.ok,
          context: trimmedContext ? trimmedContext : undefined,
        });
        if (described.__kind__ === "ok") {
          setResult({
            description: described.ok.description,
            readableText: described.ok.readableText,
          });
          setStatus("success");
        } else {
          setError(describeAiError(described.err));
          setStatus("error");
        }
      } catch (thrown) {
        setError(describeThrown(thrown));
        setStatus("error");
      }
    })();
  }

  return (
    <section
      aria-labelledby="vision.describe-title"
      data-ocid="vision.describe"
      className="flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-subtle"
    >
      <header className="flex items-start gap-3 border-b border-border px-4 py-3.5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <ImagePlus aria-hidden="true" className="size-4" />
        </span>
        <div className="min-w-0">
          <h2
            id="vision.describe-title"
            className="font-display text-sm font-semibold"
          >
            Describe an image
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Upload a photo and add what it shows. The assistant writes a
            description and pulls out any readable text.
          </p>
        </div>
      </header>

      <div className="flex flex-col gap-4 px-4 py-4">
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={cn(
            "flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-6 text-center transition-smooth",
            dragging
              ? "border-primary bg-primary/10"
              : "border-border bg-background/60",
          )}
          data-ocid="vision.describe.dropzone"
        >
          <span className="flex size-11 items-center justify-center rounded-full bg-primary/15 text-primary">
            <FileImage aria-hidden="true" className="size-5" />
          </span>
          <p className="text-sm font-medium text-foreground">
            Drag an image here, or choose a file
          </p>
          <p className="text-xs text-muted-foreground">
            PNG, JPEG, GIF or WebP up to {formatBytes(MAX_BYTES)}.
          </p>
          <label
            htmlFor="vision-image-input"
            className="mt-1 flex min-h-10 cursor-pointer items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-smooth hover:opacity-90 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2"
            data-ocid="vision.describe.upload_button"
          >
            <ImagePlus aria-hidden="true" className="size-4" />
            Choose image
          </label>
          <input
            ref={inputRef}
            id="vision-image-input"
            type="file"
            accept="image/*"
            onChange={handleInputChange}
            className="sr-only"
            data-ocid="vision.describe.file_input"
          />
        </div>

        {file && (
          <div
            className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background/60 px-3 py-2.5"
            data-ocid="vision.describe.file_preview"
          >
            <span className="flex min-w-0 items-center gap-2">
              <FileImage
                aria-hidden="true"
                className="size-4 shrink-0 text-primary"
              />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-foreground">
                  {file.name}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {formatBytes(file.size)}
                </span>
              </span>
            </span>
            <button
              type="button"
              onClick={clearFile}
              disabled={busy}
              aria-label="Remove selected image"
              className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition-smooth hover:text-foreground disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              data-ocid="vision.describe.remove_button"
            >
              <X aria-hidden="true" className="size-4" />
            </button>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <label
              htmlFor="vision-context-input"
              className="text-xs font-medium text-muted-foreground"
            >
              What does this image show? (optional)
            </label>
            {speech.supported ? (
              <button
                type="button"
                onClick={speech.listening ? speech.stop : speech.start}
                aria-label={
                  speech.listening
                    ? "Stop voice input"
                    : "Dictate the image context"
                }
                aria-pressed={speech.listening}
                className={cn(
                  "flex min-h-9 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-smooth focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
                  speech.listening
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
                data-ocid="vision.describe.voice_button"
              >
                <Mic aria-hidden="true" className="size-3.5" />
                {speech.listening ? "Stop" : "Dictate"}
              </button>
            ) : (
              <span
                className="text-xs text-muted-foreground"
                data-ocid="vision.describe.voice_unsupported_state"
              >
                Voice input is not supported in this browser.
              </span>
            )}
          </div>
          <textarea
            id="vision-context-input"
            value={context}
            onChange={(event) => setContext(event.target.value)}
            rows={3}
            placeholder="e.g. A medicine label, a street sign, or a page from a letter…"
            className="min-h-20 w-full resize-y rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            data-ocid="vision.describe.context_input"
          />
          {speech.listening && (
            <p
              className="text-xs text-primary"
              data-ocid="vision.describe.listening_state"
            >
              Listening… {speech.transcript}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            The assistant works from the filename and the text you add here. It
            cannot read the image pixels, so a short description helps it give a
            useful answer.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {!file
              ? "Choose an image to continue."
              : !context.trim()
                ? "Add a short description for the best result."
                : "Ready when you are."}
          </p>
          <button
            type="button"
            onClick={run}
            disabled={!file || busy}
            className="flex min-h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-smooth hover:opacity-90 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            data-ocid="vision.describe.submit_button"
          >
            {busy ? (
              <Loader2
                aria-hidden="true"
                className="size-4 animate-spin motion-reduce:animate-none"
              />
            ) : (
              <Sparkles aria-hidden="true" className="size-4" />
            )}
            {status === "uploading"
              ? "Uploading…"
              : status === "describing"
                ? "Describing…"
                : "Describe image"}
          </button>
        </div>

        {status === "uploading" && (
          <div
            className="flex flex-col gap-1.5"
            data-ocid="vision.describe.upload_progress"
          >
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Uploading image…</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress
              value={Math.max(4, Math.round(progress))}
              aria-label="Image upload progress"
              data-ocid="vision.describe.progress_bar"
            />
          </div>
        )}
      </div>

      <div className="border-t border-border px-4 py-4">
        {status === "idle" && (
          <p
            className="text-sm text-muted-foreground"
            data-ocid="vision.describe.empty_state"
          >
            Your description will appear here.
          </p>
        )}

        {status === "describing" && (
          <div
            className="flex items-center gap-2 text-sm text-muted-foreground"
            data-ocid="vision.describe.loading_state"
          >
            <Loader2
              aria-hidden="true"
              className="size-4 animate-spin motion-reduce:animate-none"
            />
            Writing a description…
          </div>
        )}

        {status === "error" && (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-sm text-destructive-foreground"
            data-ocid="vision.describe.error_state"
          >
            <span className="flex items-center gap-2">
              <AlertCircle aria-hidden="true" className="size-4 shrink-0" />
              {error}
            </span>
            {file && (
              <button
                type="button"
                onClick={run}
                className="flex min-h-9 items-center gap-1.5 rounded-md border border-destructive/50 px-2.5 text-xs font-medium text-foreground transition-smooth hover:bg-destructive/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                data-ocid="vision.describe.retry_button"
              >
                <RotateCcw aria-hidden="true" className="size-3.5" />
                Retry
              </button>
            )}
          </div>
        )}

        {status === "success" && result && (
          <div
            className="flex flex-col gap-4"
            data-ocid="vision.describe.success_state"
          >
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-display text-sm font-semibold">
                  Description
                </h3>
                <ReadAloudControls
                  ocid="vision.describe.description"
                  text={result.description}
                  tts={tts}
                />
              </div>
              <p className="whitespace-pre-wrap break-words rounded-lg border border-border bg-background/60 p-3.5 text-sm leading-relaxed text-foreground">
                {result.description}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-display text-sm font-semibold">
                  Readable text
                </h3>
                <ReadAloudControls
                  ocid="vision.describe.readable_text"
                  text={result.readableText}
                  tts={tts}
                />
              </div>
              {result.readableText.trim() ? (
                <p className="whitespace-pre-wrap break-words rounded-lg border border-border bg-background/60 p-3.5 font-mono text-sm leading-relaxed text-foreground">
                  {result.readableText}
                </p>
              ) : (
                <p className="rounded-lg border border-border bg-background/60 p-3.5 text-sm text-muted-foreground">
                  No readable text was found in this image.
                </p>
              )}
            </div>
          </div>
        )}

        {tts.error && (
          <p
            role="alert"
            className="mt-3 text-xs text-destructive-foreground"
            data-ocid="vision.describe.tts_error_state"
          >
            {tts.error}
          </p>
        )}
      </div>
    </section>
  );
}

/** Short guidance card explaining how the vision tools work. */
function VisionHelpCard() {
  const points = [
    "Upload a photo, then add a line about what it shows.",
    "The assistant writes a description and lists any readable text.",
    "Use Read aloud to hear the result, and Dictate to speak your context.",
  ];
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-subtle">
      <h2 className="flex items-center gap-2 font-display text-sm font-semibold">
        <Check aria-hidden="true" className="size-4 text-primary" />
        How this helps
      </h2>
      <ul className="mt-3 space-y-2.5 text-xs text-muted-foreground">
        {points.map((point) => (
          <li key={point} className="flex gap-2">
            <span
              aria-hidden="true"
              className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary"
            />
            {point}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function VisuallyImpairedPage() {
  return (
    <div data-ocid="page.vision">
      <PageHeader
        eyebrow="Vision"
        title="Visual assistance"
        description="Describe images, read text aloud, and use voice commands."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex flex-col gap-6">
          <ImageDescribeCard />
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-6 lg:self-start">
          <VisionHelpCard />
          <div className="min-h-[26rem]">
            <AssistantPanel />
          </div>
        </aside>
      </div>
    </div>
  );
}
