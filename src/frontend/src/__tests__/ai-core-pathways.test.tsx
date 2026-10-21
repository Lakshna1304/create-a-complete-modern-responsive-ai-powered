import App from "@/App";
import { renderWithActor } from "@/__tests__/test-utils";
import type { backendInterface } from "@/backend";
import { AssistanceModule } from "@/backend";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

/**
 * Cover for the accepted change: the AI core page at "/" lists all four
 * assistance pathways as selectable cards and navigates to the chosen module,
 * and every module page renders its own tools plus the shared assistant panel.
 */

function makeActor() {
  const getChatHistory = vi.fn<backendInterface["getChatHistory"]>();
  getChatHistory.mockResolvedValue([]);
  const getMySettings = vi.fn<backendInterface["getMySettings"]>();
  getMySettings.mockResolvedValue({
    preferences: { textSize: "medium" as never, highContrast: false },
    updatedAt: 0n,
  });
  const setSelectedModule = vi.fn<backendInterface["setSelectedModule"]>();
  setSelectedModule.mockResolvedValue({
    preferences: { textSize: "medium" as never, highContrast: false },
    updatedAt: 0n,
  });
  return { getChatHistory, getMySettings, setSelectedModule } satisfies Pick<
    backendInterface,
    "getChatHistory" | "getMySettings" | "setSelectedModule"
  >;
}

const PATHWAYS = [
  { label: "Visual assistance", route: "/vision" },
  { label: "Communication", route: "/communication" },
  { label: "Cognitive support", route: "/cognition" },
  { label: "Mobility support", route: "/mobility" },
];

describe("AI core pathway cards", () => {
  it("shows all four selectable pathway cards on the default route", async () => {
    window.history.pushState({}, "", "/");
    renderWithActor(<App />, makeActor());

    const list = await screen.findByRole("list", {
      name: "Assistance pathways",
    });
    for (const pathway of PATHWAYS) {
      expect(
        within(list).getByRole("button", {
          name: new RegExp(pathway.label),
        }),
      ).toBeInTheDocument();
    }
  });

  it("navigates to the chosen module and records the choice", async () => {
    const user = userEvent.setup();
    const actor = makeActor();
    window.history.pushState({}, "", "/");
    renderWithActor(<App />, actor);

    const list = await screen.findByRole("list", {
      name: "Assistance pathways",
    });
    await user.click(
      within(list).getByRole("button", { name: /Cognitive support/ }),
    );

    expect(
      await screen.findByRole("heading", { name: "Cognitive support" }),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(actor.setSelectedModule).toHaveBeenCalledWith(
        AssistanceModule.cognitive,
      ),
    );
  });

  it("still reaches the module when saving the choice fails", async () => {
    const user = userEvent.setup();
    const actor = makeActor();
    actor.setSelectedModule.mockRejectedValue(new Error("offline"));
    window.history.pushState({}, "", "/");
    renderWithActor(<App />, actor);

    const list = await screen.findByRole("list", {
      name: "Assistance pathways",
    });
    await user.click(
      within(list).getByRole("button", { name: /Mobility support/ }),
    );

    expect(
      await screen.findByRole("heading", { name: "Mobility support" }),
    ).toBeInTheDocument();
  });
});

describe("module pages render tools and the shared assistant", () => {
  async function openModule(label: string) {
    const user = userEvent.setup();
    window.history.pushState({}, "", "/");
    renderWithActor(<App />, makeActor());
    const nav = await screen.findByRole("navigation", { name: "Primary" });
    await user.click(within(nav).getByRole("link", { name: label }));
  }

  it("renders the vision tools and the assistant panel at /vision", async () => {
    await openModule("Vision");

    expect(
      await screen.findByRole("heading", { name: "Describe an image" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "AI assistant" }),
    ).toBeInTheDocument();
  });

  it("renders the communication tools and the assistant panel at /communication", async () => {
    await openModule("Communication");

    expect(
      await screen.findByRole("heading", { name: "Speak and be heard" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Sign-language phrase reference" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "AI assistant" }),
    ).toBeInTheDocument();
  });

  it("renders the cognition tools and the assistant panel at /cognition", async () => {
    await openModule("Cognition");

    expect(
      await screen.findByRole("heading", { name: "Simplify text" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Summarize text" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Step-by-step instructions" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "AI assistant" }),
    ).toBeInTheDocument();
  });

  it("renders the mobility tools and the assistant panel at /mobility", async () => {
    await openModule("Mobility");

    expect(
      await screen.findByRole("heading", { name: "Voice navigation" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Everyday task help" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "AI assistant" }),
    ).toBeInTheDocument();
  });
});
