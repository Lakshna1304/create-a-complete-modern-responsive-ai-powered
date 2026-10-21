import { useCallback, useEffect, useRef, useState } from "react";

/* ------------------------------------------------------------------ */
/* Speech recognition (speech-to-text)                                 */
/* ------------------------------------------------------------------ */

interface SpeechRecognitionAlternativeLike {
  transcript: string;
}

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionEventLike {
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionErrorEventLike {
  error: string;
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

function getRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const scope = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return scope.SpeechRecognition ?? scope.webkitSpeechRecognition ?? null;
}

export interface UseSpeechRecognitionResult {
  supported: boolean;
  listening: boolean;
  transcript: string;
  error: string | null;
  start: () => void;
  stop: () => void;
  reset: () => void;
}

/**
 * Browser speech recognition. Reports a clear error when unsupported and
 * streams the interim + final transcript back to the caller.
 */
export function useSpeechRecognition(
  onFinal?: (text: string) => void,
): UseSpeechRecognitionResult {
  const [supported] = useState(() => getRecognitionConstructor() !== null);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const onFinalRef = useRef(onFinal);
  onFinalRef.current = onFinal;

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      recognitionRef.current = null;
    };
  }, []);

  const start = useCallback(() => {
    const Constructor = getRecognitionConstructor();
    if (!Constructor) {
      setError("Speech recognition is not supported in this browser.");
      return;
    }
    setError(null);
    setTranscript("");
    const recognition = new Constructor();
    recognition.lang = navigator.language || "en-US";
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let text = "";
      for (let i = 0; i < event.results.length; i += 1) {
        text += event.results[i][0].transcript;
      }
      setTranscript(text);
    };
    recognition.onerror = (event) => {
      setListening(false);
      if (
        event.error === "not-allowed" ||
        event.error === "service-not-allowed"
      ) {
        setError("Microphone access was blocked. Allow it and try again.");
      } else if (event.error === "no-speech") {
        setError("No speech detected. Please try again.");
      } else {
        setError("Speech recognition stopped unexpectedly. Please try again.");
      }
    };
    recognition.onend = () => {
      setListening(false);
      setTranscript((current) => {
        const trimmed = current.trim();
        if (trimmed) onFinalRef.current?.(trimmed);
        return current;
      });
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setListening(true);
    } catch {
      setError("Could not start speech recognition. Please try again.");
      setListening(false);
    }
  }, []);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  const reset = useCallback(() => {
    setTranscript("");
    setError(null);
  }, []);

  return { supported, listening, transcript, error, start, stop, reset };
}

/* ------------------------------------------------------------------ */
/* Speech synthesis (text-to-speech)                                   */
/* ------------------------------------------------------------------ */

export interface UseSpeechSynthesisResult {
  supported: boolean;
  speaking: boolean;
  paused: boolean;
  error: string | null;
  speak: (text: string) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
}

/**
 * Browser text-to-speech with play, pause, resume and stop. Reports a clear
 * error when the browser does not support speech synthesis.
 */
export function useSpeechSynthesis(): UseSpeechSynthesisResult {
  const [supported] = useState(
    () => typeof window !== "undefined" && "speechSynthesis" in window,
  );
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (!supported) {
        setError("Read-aloud is not supported in this browser.");
        return;
      }
      const trimmed = text.trim();
      if (!trimmed) {
        setError("There is nothing to read aloud yet.");
        return;
      }
      setError(null);
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(trimmed);
      utterance.lang = navigator.language || "en-US";
      utterance.onstart = () => {
        setSpeaking(true);
        setPaused(false);
      };
      utterance.onend = () => {
        setSpeaking(false);
        setPaused(false);
      };
      utterance.onerror = () => {
        setSpeaking(false);
        setPaused(false);
        setError("Read-aloud stopped unexpectedly. Please try again.");
      };
      window.speechSynthesis.speak(utterance);
    },
    [supported],
  );

  const pause = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.pause();
    setPaused(true);
  }, [supported]);

  const resume = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.resume();
    setPaused(false);
  }, [supported]);

  const stop = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
    setPaused(false);
  }, [supported]);

  return { supported, speaking, paused, error, speak, pause, resume, stop };
}
