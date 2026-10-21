import App from "@/App";
import { renderWithActor } from "@/__tests__/test-utils";
import type { backendInterface } from "@/backend";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

/**
 * Characterization baseline for the app shell and routing that the accepted
 * change must not break: the default route renders a real page (never a blank
 * screen), the sidebar exposes every pathway, and each module route renders its
 * own heading.
 */

function makeActor() {
  const getChatHistory = vi.fn<backendInterface["getChatHistory"]>();
  getChatHistory.mockResolvedValue([]);
  const getMySettings = vi.fn<backendInterface["getMySettings"]>();
  getMySettings.mockResolvedValue({
    preferences: { textSize: "medium" as never, highContrast: false },
    updatedAt: 0n,
  });
  return { getChatHistory, getMySettings } satisfies Pick<
    backendInterface,
    "getChatHistory" | "getMySettings"
  >;
}

describe("app shell", () => {
  it("renders the default route without a blank screen", async () => {
    renderWithActor(<App />, makeActor());

    expect(
      await screen.findByRole("heading", { name: "Access, on your terms." }),
    ).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
  });

  it("exposes a navigation link for the AI core and every module", async () => {
    renderWithActor(<App />, makeActor());

    const nav = await screen.findByRole("navigation", { name: "Primary" });
    expect(
      within(nav).getByRole("link", { name: "AI core" }),
    ).toBeInTheDocument();
    for (const label of ["Vision", "Communication", "Cognition", "Mobility"]) {
      expect(
        within(nav).getByRole("link", { name: label }),
      ).toBeInTheDocument();
    }
  });

  it("renders the vision module heading after navigating from the sidebar", async () => {
    const user = userEvent.setup();
    renderWithActor(<App />, makeActor());

    const nav = await screen.findByRole("navigation", { name: "Primary" });
    await user.click(within(nav).getByRole("link", { name: "Vision" }));

    expect(
      await screen.findByRole("heading", { name: "Visual assistance" }),
    ).toBeInTheDocument();
  });

  it("renders the communication module heading after navigating from the sidebar", async () => {
    const user = userEvent.setup();
    renderWithActor(<App />, makeActor());

    const nav = await screen.findByRole("navigation", { name: "Primary" });
    await user.click(within(nav).getByRole("link", { name: "Communication" }));

    expect(
      await screen.findByRole("heading", { name: "Communication" }),
    ).toBeInTheDocument();
  });

  it("renders the cognition module heading after navigating from the sidebar", async () => {
    const user = userEvent.setup();
    renderWithActor(<App />, makeActor());

    const nav = await screen.findByRole("navigation", { name: "Primary" });
    await user.click(within(nav).getByRole("link", { name: "Cognition" }));

    expect(
      await screen.findByRole("heading", { name: "Cognitive support" }),
    ).toBeInTheDocument();
  });

  it("renders the mobility module heading after navigating from the sidebar", async () => {
    const user = userEvent.setup();
    renderWithActor(<App />, makeActor());

    const nav = await screen.findByRole("navigation", { name: "Primary" });
    await user.click(within(nav).getByRole("link", { name: "Mobility" }));

    expect(
      await screen.findByRole("heading", { name: "Mobility support" }),
    ).toBeInTheDocument();
  });
});
