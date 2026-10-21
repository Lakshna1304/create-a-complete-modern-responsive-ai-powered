import { type ChatContextTurn, ChatRole } from "@/backend";
import {
  useChat,
  useChatHistory,
  useClearChatHistory,
} from "@/hooks/useQueries";
import { useSpeechRecognition, useSpeechSynthesis } from "@/hooks/useSpeech";
import { describeAiError, describeThrown } from "@/lib/ai-errors";
import { formatClock } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  Bot,
  Loader2,
  Mic,
  Send,
  Square,
  Trash2,
  User,
  Volume2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

interface DisplayMessage {
  key: string;
  role: ChatRole;
  content: string;
  createdAt: bigint | null;
}

/**
 * Shared AI assistant available from every module. Bound to the backend chat
 * endpoint with voice input, read-aloud, session history and error retry.
 */
export function AssistantPanel({ context }: { context?: ChatContextTurn[] }) {
  const history = useChatHistory();
  const chat = useChat();
  const clearHistory = useClearChatHistory();
  const tts = useSpeechSynthesis();

  const [draft, setDraft] = useState("");
  const [pendingText, setPendingText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastFailed, setLastFailed] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const speech = useSpeechRecognition((text) => {
    setDraft((current) => (current ? `${current} ${text}` : text));
  });

  const messages = useMemo<DisplayMessage[]>(() => {
    const saved: DisplayMessage[] = (history.data ?? []).map((message) => ({
      key: `saved-${message.id.toString()}`,
      role: message.role,
      content: message.content,
      createdAt: message.createdAt,
    }));
    if (pendingText) {
      saved.push({
        key: "pending-user",
        role: ChatRole.user,
        content: pendingText,
        createdAt: null,
      });
    }
    if (chat.isPending) {
      saved.push({
        key: "pending-assistant",
        role: ChatRole.assistant,
        content: "",
        createdAt: null,
      });
    }
    return saved;
  }, [history.data, pendingText, chat.isPending]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on new messages
  useEffect(() => {
    const node = listRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messages.length]);

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || chat.isPending) return;
    setError(null);
    setLastFailed(null);
    setDraft("");
    setPendingText(trimmed);
    chat.mutate(
      { message: trimmed, context: context ?? [] },
      {
        onSuccess: (result) => {
          setPendingText(null);
          if (result.__kind__ === "err") {
            setError(describeAiError(result.err));
            setLastFailed(trimmed);
          }
        },
        onError: (thrown) => {
          setPendingText(null);
          setError(describeThrown(thrown));
          setLastFailed(trimmed);
        },
      },
    );
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    send(draft);
  }

  function handleRetry() {
    if (lastFailed) send(lastFailed);
  }

  const lastAssistant = [...messages]
    .reverse()
    .find((message) => message.role === ChatRole.assistant && message.content);

  return (
    <section
      aria-label="AI assistant"
      data-ocid="assistant.panel"
      className="flex h-full min-h-[26rem] flex-col overflow-hidden rounded-xl border border-border bg-card"
    >
      <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Bot aria-hidden="true" className="size-4" />
          </span>
          <div className="leading-tight">
            <h2 className="font-display text-sm font-semibold">AI assistant</h2>
            <p className="text-xs text-muted-foreground">
              Ask anything, in any module
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setLastFailed(null);
            clearHistory.mutate();
          }}
          disabled={clearHistory.isPending || messages.length === 0}
          className="flex min-h-9 items-center gap-1.5 rounded-lg border border-border px-2.5 text-xs font-medium text-muted-foreground transition-smooth hover:text-foreground disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          data-ocid="assistant.clear_button"
        >
          <Trash2 aria-hidden="true" className="size-3.5" />
          Clear
        </button>
      </header>

      <div
        ref={listRef}
        className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
        data-ocid="assistant.message_list"
      >
        {history.isLoading && (
          <p
            className="text-sm text-muted-foreground"
            data-ocid="assistant.loading_state"
          >
            Loading your conversation…
          </p>
        )}

        {!history.isLoading && messages.length === 0 && (
          <div
            className="flex h-full flex-col items-center justify-center gap-2 py-8 text-center"
            data-ocid="assistant.empty_state"
          >
            <span className="flex size-11 items-center justify-center rounded-full bg-primary/15 text-primary">
              <Bot aria-hidden="true" className="size-5" />
            </span>
            <p className="font-display text-sm font-semibold">
              How can I help today?
            </p>
            <p className="max-w-xs text-xs text-muted-foreground">
              Type a message or use the microphone to ask by voice.
            </p>
          </div>
        )}

        {messages.map((message, index) => {
          const isUser = message.role === ChatRole.user;
          const isPendingReply = message.key === "pending-assistant";
          return (
            <div
              key={message.key}
              data-ocid={`assistant.message.${index + 1}`}
              className={cn(
                "flex gap-2.5",
                isUser ? "flex-row-reverse" : "flex-row",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full",
                  isUser
                    ? "bg-secondary text-secondary-foreground"
                    : "bg-primary/15 text-primary",
                )}
              >
                {isUser ? (
                  <User aria-hidden="true" className="size-3.5" />
                ) : (
                  <Bot aria-hidden="true" className="size-3.5" />
                )}
              </span>
              <div
                className={cn(
                  "max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed",
                  isUser
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground",
                )}
              >
                {isPendingReply ? (
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Loader2
                      aria-hidden="true"
                      className="size-3.5 animate-spin motion-reduce:animate-none"
                    />
                    Thinking…
                  </span>
                ) : (
                  <>
                    <p className="whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                    <div className="mt-1 flex items-center justify-between gap-3">
                      <span
                        className={cn(
                          "text-[0.625rem]",
                          isUser
                            ? "text-primary-foreground/70"
                            : "text-muted-foreground",
                        )}
                      >
                        {message.createdAt
                          ? formatClock(message.createdAt)
                          : ""}
                      </span>
                      {!isUser && (
                        <button
                          type="button"
                          onClick={() => tts.speak(message.content)}
                          aria-label="Read this reply aloud"
                          className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-smooth hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                          data-ocid={`assistant.read_aloud_button.${index + 1}`}
                        >
                          <Volume2 aria-hidden="true" className="size-3.5" />
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {(error || speech.error || tts.error) && (
        <div
          role="alert"
          data-ocid="assistant.error_state"
          className="mx-4 mb-2 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive-foreground"
        >
          <span>{error ?? speech.error ?? tts.error}</span>
          {error && lastFailed && (
            <button
              type="button"
              onClick={handleRetry}
              className="rounded-md border border-destructive/50 px-2 py-1 font-medium text-foreground transition-smooth hover:bg-destructive/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              data-ocid="assistant.retry_button"
            >
              Retry
            </button>
          )}
        </div>
      )}

      {tts.speaking && (
        <div className="mx-4 mb-2 flex items-center gap-2">
          <button
            type="button"
            onClick={tts.paused ? tts.resume : tts.pause}
            className="flex min-h-9 items-center gap-1.5 rounded-lg border border-border px-2.5 text-xs font-medium transition-smooth hover:bg-accent/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            data-ocid="assistant.tts_pause_button"
          >
            {tts.paused ? "Resume" : "Pause"}
          </button>
          <button
            type="button"
            onClick={tts.stop}
            className="flex min-h-9 items-center gap-1.5 rounded-lg border border-border px-2.5 text-xs font-medium transition-smooth hover:bg-accent/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            data-ocid="assistant.tts_stop_button"
          >
            <Square aria-hidden="true" className="size-3" />
            Stop
          </button>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="border-t border-border p-3"
        data-ocid="assistant.form"
      >
        {speech.listening && (
          <p
            className="mb-2 text-xs text-primary"
            data-ocid="assistant.listening_state"
          >
            Listening… {speech.transcript}
          </p>
        )}
        <div className="flex items-end gap-2">
          <label htmlFor="assistant-input" className="sr-only">
            Message the AI assistant
          </label>
          <textarea
            id="assistant-input"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                send(draft);
              }
            }}
            rows={1}
            placeholder="Ask the assistant…"
            className="min-h-11 flex-1 resize-none rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            data-ocid="assistant.input"
          />
          <button
            type="button"
            onClick={speech.listening ? speech.stop : speech.start}
            aria-label={
              speech.listening ? "Stop voice input" : "Start voice input"
            }
            aria-pressed={speech.listening}
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-lg border transition-smooth focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
              speech.listening
                ? "border-primary bg-primary/15 text-primary"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
            data-ocid="assistant.voice_button"
          >
            <Mic aria-hidden="true" className="size-4" />
          </button>
          <button
            type="submit"
            disabled={!draft.trim() || chat.isPending}
            aria-label="Send message"
            className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-smooth hover:opacity-90 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            data-ocid="assistant.send_button"
          >
            {chat.isPending ? (
              <Loader2
                aria-hidden="true"
                className="size-4 animate-spin motion-reduce:animate-none"
              />
            ) : (
              <Send aria-hidden="true" className="size-4" />
            )}
          </button>
        </div>
        {lastAssistant && !tts.speaking && (
          <button
            type="button"
            onClick={() => tts.speak(lastAssistant.content)}
            className="mt-2 text-xs font-medium text-primary underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            data-ocid="assistant.read_last_button"
          >
            Read the last reply aloud
          </button>
        )}
      </form>
    </section>
  );
}
