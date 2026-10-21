import App from "@/App";
import { renderWithActor } from "@/__tests__/test-utils";
import type { backendInterface } from "@/backend";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * Cover for the accepted change: the app shell now mounts the sign-in control
 * and the accessibility controls, and the high-contrast and text-size choices
 * persist across a reload.
 */

const STORAGE_KEY = "accessai.accessibility";

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

afterEach(() => {
  window.localStorage.clear();
});

describe("app shell controls", () => {
  it("exposes the sign-in control in the shell", async () => {
    renderWithActor(<App />, makeActor());

    // The shell renders the control in both the desktop sidebar and the
    // mobile header, so at least one is always reachable.
    expect(
      await screen.findAllByRole("button", {
        name: "Sign in with Internet Identity",
      }),
    ).not.toHaveLength(0);
  });

  it("exposes the high-contrast toggle and text-size control", async () => {
    renderWithActor(<App />, makeActor());

    const panel = await screen.findByRole("region", {
      name: "Accessibility settings",
    });
    expect(
      within(panel).getByRole("switch", {
        name: "Toggle high contrast mode",
      }),
    ).toBeInTheDocument();
    for (const label of ["Small", "Medium", "Large", "Extra large"]) {
      expect(
        within(panel).getByRole("button", { name: label }),
      ).toBeInTheDocument();
    }
  });

  it("toggles high contrast and persists the choice across a reload", async () => {
    const user = userEvent.setup();
    const first = renderWithActor(<App />, makeActor());

    const toggle = await screen.findByRole("switch", {
      name: "Toggle high contrast mode",
    });
    expect(toggle).toHaveAttribute("aria-checked", "false");
    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-checked", "true");
    await waitFor(() =>
      expect(
        JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}"),
      ).toMatchObject({ highContrast: true }),
    );

    first.unmount();
    renderWithActor(<App />, makeActor());

    expect(
      await screen.findByRole("switch", {
        name: "Toggle high contrast mode",
      }),
    ).toHaveAttribute("aria-checked", "true");
  });

  it("changes text size and persists the choice across a reload", async () => {
    const user = userEvent.setup();
    const first = renderWithActor(<App />, makeActor());

    const panel = await screen.findByRole("region", {
      name: "Accessibility settings",
    });
    await user.click(within(panel).getByRole("button", { name: "Large" }));
    await waitFor(() =>
      expect(
        JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}"),
      ).toMatchObject({ textSize: "large" }),
    );

    first.unmount();
    renderWithActor(<App />, makeActor());

    const reloaded = await screen.findByRole("region", {
      name: "Accessibility settings",
    });
    expect(
      within(reloaded).getByRole("button", { name: "Large" }),
    ).toHaveAttribute("aria-pressed", "true");
  });
});
