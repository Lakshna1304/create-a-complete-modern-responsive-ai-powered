import { MODULE_LIST } from "@/types";

export interface NavItem {
  to: string;
  label: string;
  /** lucide-react icon name is resolved in the component. */
  icon: "sparkles" | "eye" | "message-circle" | "brain" | "accessibility";
}

export const CORE_NAV: NavItem = {
  to: "/",
  label: "AI core",
  icon: "sparkles",
};

export const MODULE_NAV: NavItem[] = MODULE_LIST.map((meta) => ({
  to: meta.route,
  label: meta.label,
  icon:
    meta.id === "visuallyImpaired"
      ? "eye"
      : meta.id === "deafAndMute"
        ? "message-circle"
        : meta.id === "cognitive"
          ? "brain"
          : "accessibility",
}));
