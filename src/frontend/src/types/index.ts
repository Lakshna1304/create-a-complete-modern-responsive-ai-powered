import { AssistanceModule, TextSize } from "@/backend";

export { AssistanceModule, TextSize };
export type {
  AssistanceModule as AssistanceModuleType,
  TextSize as TextSizeType,
};

/** The four assistance pathways, in display order. */
export const MODULE_ORDER: AssistanceModule[] = [
  AssistanceModule.visuallyImpaired,
  AssistanceModule.deafAndMute,
  AssistanceModule.cognitive,
  AssistanceModule.mobility,
];

/** The four module route paths, matching the router's registered routes. */
export type ModuleRoute =
  | "/vision"
  | "/communication"
  | "/cognition"
  | "/mobility";

export interface ModuleMeta {
  id: AssistanceModule;
  index: string;
  label: string;
  title: string;
  description: string;
  route: ModuleRoute;
  /** Tailwind classes for the circular icon badge. */
  badgeClass: string;
  /** Tailwind text color for the pathway number. */
  accentClass: string;
}

export const MODULE_META: Record<string, ModuleMeta> = {
  visuallyImpaired: {
    id: AssistanceModule.visuallyImpaired,
    index: "01",
    label: "Vision",
    title: "Visual assistance",
    description:
      "Describe images, read text aloud, and use voice commands to navigate the world.",
    route: "/vision",
    badgeClass: "bg-primary/15 text-primary",
    accentClass: "text-primary",
  },
  deafAndMute: {
    id: AssistanceModule.deafAndMute,
    index: "02",
    label: "Communication",
    title: "Communication",
    description:
      "Type to speak, or use speech-to-text to capture a conversation in real time.",
    route: "/communication",
    badgeClass: "bg-chart-2/15 text-chart-2",
    accentClass: "text-chart-2",
  },
  cognitive: {
    id: AssistanceModule.cognitive,
    index: "03",
    label: "Cognition",
    title: "Cognitive support",
    description:
      "Break down complex ideas and turn long text into clear, simple key points.",
    route: "/cognition",
    badgeClass: "bg-warning/15 text-warning",
    accentClass: "text-warning",
  },
  mobility: {
    id: AssistanceModule.mobility,
    index: "04",
    label: "Mobility",
    title: "Mobility support",
    description:
      "Get spoken guidance, hands-free controls, and help with everyday digital tasks.",
    route: "/mobility",
    badgeClass: "bg-accent/15 text-accent",
    accentClass: "text-accent",
  },
};

export const MODULE_LIST: ModuleMeta[] = MODULE_ORDER.map(
  (id) => MODULE_META[id],
);

/** Human-readable labels for the four text-size steps. */
export const TEXT_SIZE_STEPS: {
  value: TextSize;
  label: string;
  scale: number;
}[] = [
  { value: TextSize.small, label: "Small", scale: 1 },
  { value: TextSize.medium, label: "Medium", scale: 2 },
  { value: TextSize.large, label: "Large", scale: 3 },
  { value: TextSize.extraLarge, label: "Extra large", scale: 4 },
];

export function textSizeToScale(size: TextSize): number {
  return TEXT_SIZE_STEPS.find((step) => step.value === size)?.scale ?? 2;
}

export function scaleToTextSize(scale: number): TextSize {
  const clamped = Math.min(4, Math.max(1, Math.round(scale)));
  return (
    TEXT_SIZE_STEPS.find((step) => step.scale === clamped)?.value ??
    TextSize.medium
  );
}
