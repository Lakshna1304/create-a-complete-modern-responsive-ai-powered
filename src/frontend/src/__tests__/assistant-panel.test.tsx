import { renderWithActor } from "@/__tests__/test-utils";
import type { backendInterface } from "@/backend";
import { ChatRole } from "@/backend";
import { AssistantPanel } from "@/components/assistant/AssistantPanel";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

/**
 * Characterization baseline for the shared AI assistant that every module
 * embeds. It must keep loading history, sending a message through the backend
 * actor, and rendering the reply.
 */

type ChatMessage = Awaited<
  ReturnType<backendInterface["getChatHistory"]>
>[number];

/**
 * Stateful fake: the real backend persists both turns of a chat, so a
 * successful `chat` must be visible through a later `getChatHistory` read.
 * Every read returns a fresh clone so the query cache never aliases the store.
 */
function makeActor(initial: ChatMessage[] = []) {
  const store: ChatMessage[] = [...initial];
  const getChatHistory = vi.fn<backendInterface["getChatHistory"]>();
  getChatHistory.mockImplementation(async () => structuredClone(store));
  const chat = vi.fn<backendInterface["chat"]>();
  chat.mockImplementation(async (request) => {
    store.push({
      id: BigInt(store.length + 1),
      content: request.message,
      createdAt: 0n,
      role: ChatRole.user,
    });
    return { __kind__: "ok", ok: { reply: "", createdAt: 0n } };
  });
  const clearChatHistory = vi.fn<backendInterface["clearChatHistory"]>();
  clearChatHistory.mockImplementation(async () => {
    store.length = 0;
  });
  return { getChatHistory, chat, clearChatHistory } satisfies Pick<
    backendInterface,
    "getChatHistory" | "chat" | "clearChatHistory"
  >;
}

describe("shared AI assistant", () => {
  it("shows the empty state when there is no saved history", async () => {
    renderWithActor(<AssistantPanel />, makeActor([]));

    expect(
      await screen.findByText("How can I help today?"),
    ).toBeInTheDocument();
  });

  it("renders saved conversation history", async () => {
    renderWithActor(
      <AssistantPanel />,
      makeActor([
        {
          id: 1n,
          content: "Hello there",
          createdAt: 0n,
          role: ChatRole.user,
        },
        {
          id: 2n,
          content: "Hi, how can I help?",
          createdAt: 0n,
          role: ChatRole.assistant,
        },
      ]),
    );

    expect(await screen.findByText("Hello there")).toBeInTheDocument();
    expect(screen.getByText("Hi, how can I help?")).toBeInTheDocument();
  });

  it("sends a typed message through the actor and shows the reply", async () => {
    const user = userEvent.setup();
    const actor = makeActor([]);
    actor.chat.mockImplementation(async (request) => {
      actor.getChatHistory.mockResolvedValue([
        {
          id: 1n,
          content: request.message,
          createdAt: 0n,
          role: ChatRole.user,
        },
        {
          id: 2n,
          content: "Here is your answer.",
          createdAt: 0n,
          role: ChatRole.assistant,
        },
      ]);
      return {
        __kind__: "ok",
        ok: { reply: "Here is your answer.", createdAt: 0n },
      };
    });
    renderWithActor(<AssistantPanel />, actor);

    await screen.findByText("How can I help today?");
    await user.type(
      screen.getByLabelText("Message the AI assistant"),
      "What can you do?",
    );
    await user.click(screen.getByRole("button", { name: "Send message" }));

    await waitFor(() =>
      expect(actor.chat).toHaveBeenCalledWith({
        message: "What can you do?",
        context: [],
      }),
    );
    expect(await screen.findByText("Here is your answer.")).toBeInTheDocument();
  });

  it("surfaces a backend error and offers a retry", async () => {
    const user = userEvent.setup();
    const actor = makeActor([]);
    actor.chat.mockResolvedValue({
      __kind__: "err",
      err: "inferenceUnavailable" as never,
    });
    renderWithActor(<AssistantPanel />, actor);

    await screen.findByText("How can I help today?");
    await user.type(
      screen.getByLabelText("Message the AI assistant"),
      "Are you there?",
    );
    await user.click(screen.getByRole("button", { name: "Send message" }));

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });
});
