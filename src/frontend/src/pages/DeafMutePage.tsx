import { AssistantPanel } from "@/components/assistant/AssistantPanel";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { useSpeechRecognition, useSpeechSynthesis } from "@/hooks/useSpeech";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  Eraser,
  Mic,
  MicOff,
  Square,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useState } from "react";

interface SignPhrase {
  id: string;
  phrase: string;
  meaning: string;
  category: string;
}

const SIGN_PHRASES: SignPhrase[] = [
  {
    id: "hello",
    phrase: "Hello",
    meaning: "Open hand raised near the forehead, moved outward like a salute.",
    category: "Greetings",
  },
  {
    id: "thank-you",
    phrase: "Thank you",
    meaning:
      "Fingertips touch the chin, then move forward and down toward the other person.",
    category: "Greetings",
  },
  {
    id: "please",
    phrase: "Please",
    meaning: "Flat hand circles over the chest in a clockwise motion.",
    category: "Greetings",
  },
  {
    id: "yes",
    phrase: "Yes",
    meaning: "A closed fist nods up and down, like a nodding head.",
    category: "Everyday",
  },
  {
    id: "no",
    phrase: "No",
    meaning: "Index and middle finger tap down against the thumb, twice.",
    category: "Everyday",
  },
  {
    id: "help",
    phrase: "Help",
    meaning:
      "One fist rests on the open palm of the other hand, both lifted together.",
    category: "Everyday",
  },
  {
    id: "water",
    phrase: "Water",
    meaning: "A 'W' handshape taps the side of the chin.",
    category: "Needs",
  },
  {
    id: "food",
    phrase: "Food / Eat",
    meaning: "Fingertips gather and tap the mouth repeatedly.",
    category: "Needs",
  },
  {
    id: "bathroom",
    phrase: "Bathroom",
    meaning: "A 'T' handshape shakes side to side between the raised fingers.",
    category: "Needs",
  },
  {
    id: "pain",
    phrase: "Pain / Hurt",
    meaning: "Both index fingers point toward each other and twist inward.",
    category: "Needs",
  },
  {
    id: "name",
    phrase: "My name is…",
    meaning:
      "Two fingers of one hand tap twice on the two fingers of the other hand.",
    category: "Introductions",
  },
  {
    id: "understand",
    phrase: "I understand",
    meaning:
      "Index finger flicks up near the temple, like a light switching on.",
    category: "Introductions",
  },
];

const CATEGORIES = Array.from(new Set(SIGN_PHRASES.map((p) => p.category)));

/**
 * Deaf and Mute communication pathway: a shared AI assistant, a speech-to-text
 * composer with read-aloud playback, and a sign-language phrase reference.
 */
export default function DeafMutePage() {
  const speech = useSpeechRecognition();
  const tts = useSpeechSynthesis();
  const [composerText, setComposerText] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const visiblePhrases =
    activeCategory === "All"
      ? SIGN_PHRASES
      : SIGN_PHRASES.filter((phrase) => phrase.category === activeCategory);

  function handleCapture() {
    if (speech.listening) {
      speech.stop();
      return;
    }
    speech.start();
  }

  function handleInsertTranscript() {
    const captured = speech.transcript.trim();
    if (!captured) return;
    setComposerText((current) =>
      current ? `${current} ${captured}` : captured,
    );
    speech.reset();
  }

  return (
    <div data-ocid="page.communication">
      <PageHeader
        eyebrow="Communication"
        title="Communication"
        description="Type to speak, or use speech-to-text to capture a conversation."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <section
          aria-labelledby="speech-composer-heading"
          data-ocid="communication.speech_panel"
          className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-subtle"
        >
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-accent/15 text-accent">
              <Mic aria-hidden="true" className="size-4" />
            </span>
            <div className="leading-tight">
              <h2
                id="speech-composer-heading"
                className="font-display text-sm font-semibold"
              >
                Speak and be heard
              </h2>
              <p className="text-xs text-muted-foreground">
                Capture speech as text, then play it back aloud
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              onClick={handleCapture}
              disabled={!speech.supported}
              aria-pressed={speech.listening}
              data-ocid="communication.mic_button"
              className={cn(
                "min-h-11 rounded-lg",
                speech.listening &&
                  "bg-destructive text-destructive-foreground",
              )}
            >
              {speech.listening ? (
                <MicOff aria-hidden="true" />
              ) : (
                <Mic aria-hidden="true" />
              )}
              {speech.listening ? "Stop listening" : "Start listening"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleInsertTranscript}
              disabled={!speech.transcript.trim()}
              data-ocid="communication.insert_transcript_button"
              className="min-h-11 rounded-lg"
            >
              Add to message
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                speech.reset();
                setComposerText("");
              }}
              disabled={!composerText && !speech.transcript}
              data-ocid="communication.clear_button"
              className="min-h-11 rounded-lg"
            >
              <Eraser aria-hidden="true" />
              Clear
            </Button>
          </div>

          {!speech.supported && (
            <p
              role="alert"
              data-ocid="communication.speech_unsupported_state"
              className="rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-foreground"
            >
              Speech recognition is not available in this browser. You can still
              type your message below.
            </p>
          )}

          {speech.listening && (
            <p
              className="text-xs text-primary"
              data-ocid="communication.listening_state"
            >
              Listening… {speech.transcript || "speak now"}
            </p>
          )}

          {speech.error && (
            <p
              role="alert"
              data-ocid="communication.speech_error_state"
              className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive-foreground"
            >
              {speech.error}
            </p>
          )}

          <div className="flex flex-col gap-2">
            <label
              htmlFor="communication-composer"
              className="text-xs font-medium text-muted-foreground"
            >
              Your message
            </label>
            <textarea
              id="communication-composer"
              value={composerText}
              onChange={(event) => setComposerText(event.target.value)}
              rows={4}
              placeholder="Type here, or capture speech and add it to this message…"
              className="min-h-24 w-full resize-y rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              data-ocid="communication.textarea"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              onClick={() => tts.speak(composerText)}
              disabled={!composerText.trim() || !tts.supported}
              data-ocid="communication.speak_button"
              className="min-h-11 rounded-lg"
            >
              <Volume2 aria-hidden="true" />
              Play aloud
            </Button>
            {tts.speaking && (
              <Button
                type="button"
                variant="outline"
                onClick={tts.stop}
                data-ocid="communication.stop_speaking_button"
                className="min-h-11 rounded-lg"
              >
                <Square aria-hidden="true" />
                Stop
              </Button>
            )}
          </div>

          {!tts.supported && (
            <p
              data-ocid="communication.tts_unsupported_state"
              className="text-xs text-muted-foreground"
            >
              Read-aloud is not available in this browser.
            </p>
          )}

          {tts.error && (
            <p
              role="alert"
              data-ocid="communication.tts_error_state"
              className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive-foreground"
            >
              {tts.error}
            </p>
          )}
        </section>

        <AssistantPanel />
      </div>

      <section
        aria-labelledby="sign-reference-heading"
        data-ocid="communication.sign_reference"
        className="mt-8"
      >
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <BookOpen aria-hidden="true" className="size-4" />
            </span>
            <div className="leading-tight">
              <h2
                id="sign-reference-heading"
                className="font-display text-lg font-semibold"
              >
                Sign-language phrase reference
              </h2>
              <p className="text-xs text-muted-foreground">
                Common phrases with their spelled-out meaning
              </p>
            </div>
          </div>
          <div
            className="flex flex-wrap gap-2"
            data-ocid="communication.sign_category_tabs"
          >
            {["All", ...CATEGORIES].map((category) => {
              const isActive = activeCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  aria-pressed={isActive}
                  data-ocid={`communication.sign_category.${category.toLowerCase()}`}
                  className={cn(
                    "min-h-9 rounded-full border px-3 text-xs font-medium transition-smooth focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
                    isActive
                      ? "border-primary bg-primary/15 text-primary"
                      : "border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>

        <ul
          className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
          data-ocid="communication.sign_list"
        >
          {visiblePhrases.map((phrase, index) => (
            <li
              key={phrase.id}
              data-ocid={`communication.sign_item.${index + 1}`}
              className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4 shadow-subtle"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-display text-sm font-semibold">
                  {phrase.phrase}
                </h3>
                <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[0.625rem] font-medium uppercase tracking-wider text-secondary-foreground">
                  {phrase.category}
                </span>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {phrase.meaning}
              </p>
              <button
                type="button"
                onClick={() => tts.speak(phrase.phrase)}
                disabled={!tts.supported}
                aria-label={`Read "${phrase.phrase}" aloud`}
                data-ocid={`communication.sign_read_button.${index + 1}`}
                className="mt-auto flex min-h-9 w-fit items-center gap-1.5 rounded-lg border border-border px-2.5 text-xs font-medium text-muted-foreground transition-smooth hover:text-foreground disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                {tts.supported ? (
                  <Volume2 aria-hidden="true" className="size-3.5" />
                ) : (
                  <VolumeX aria-hidden="true" className="size-3.5" />
                )}
                Read aloud
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
