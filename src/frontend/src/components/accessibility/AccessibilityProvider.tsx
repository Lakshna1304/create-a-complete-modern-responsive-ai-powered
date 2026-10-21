import { TextSize } from "@/backend";
import { scaleToTextSize, textSizeToScale } from "@/types";
import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY = "accessai.accessibility";

interface StoredPreferences {
  highContrast: boolean;
  textSize: TextSize;
}

interface AccessibilityContextValue {
  highContrast: boolean;
  textSize: TextSize;
  textScale: number;
  setHighContrast: (value: boolean) => void;
  setTextSize: (value: TextSize) => void;
  setTextScale: (scale: number) => void;
}

const AccessibilityContext = createContext<AccessibilityContextValue | null>(
  null,
);

function readStored(): StoredPreferences {
  if (typeof window === "undefined") {
    return { highContrast: false, textSize: TextSize.medium };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { highContrast: false, textSize: TextSize.medium };
    const parsed = JSON.parse(raw) as Partial<StoredPreferences>;
    const validSizes = Object.values(TextSize) as string[];
    return {
      highContrast: parsed.highContrast === true,
      textSize:
        parsed.textSize && validSizes.includes(parsed.textSize)
          ? parsed.textSize
          : TextSize.medium,
    };
  } catch {
    return { highContrast: false, textSize: TextSize.medium };
  }
}

/**
 * App-wide accessibility preferences. Persisted to localStorage so the
 * high-contrast mode and text size apply on every page and every session.
 */
export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<StoredPreferences>(readStored);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("high-contrast", preferences.highContrast);
    root.classList.toggle("dark", !preferences.highContrast);
    for (let scale = 1; scale <= 4; scale += 1) {
      root.classList.toggle(
        `text-scale-${scale}`,
        textSizeToScale(preferences.textSize) === scale,
      );
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch {
      // Storage may be unavailable; preferences still apply for this session.
    }
  }, [preferences]);

  const setHighContrast = useCallback((value: boolean) => {
    setPreferences((current) => ({ ...current, highContrast: value }));
  }, []);

  const setTextSize = useCallback((value: TextSize) => {
    setPreferences((current) => ({ ...current, textSize: value }));
  }, []);

  const setTextScale = useCallback((scale: number) => {
    setPreferences((current) => ({
      ...current,
      textSize: scaleToTextSize(scale),
    }));
  }, []);

  const value = useMemo<AccessibilityContextValue>(
    () => ({
      highContrast: preferences.highContrast,
      textSize: preferences.textSize,
      textScale: textSizeToScale(preferences.textSize),
      setHighContrast,
      setTextSize,
      setTextScale,
    }),
    [preferences, setHighContrast, setTextSize, setTextScale],
  );

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility(): AccessibilityContextValue {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error(
      "useAccessibility must be used within an AccessibilityProvider",
    );
  }
  return context;
}
