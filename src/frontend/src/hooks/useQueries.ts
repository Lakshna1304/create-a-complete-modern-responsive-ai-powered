import { createActor } from "@/backend";
import type {
  AccessibilityPreferences,
  AssistanceModule,
  ChatContextTurn,
  ChatRequest,
  DescribeImageRequest,
  SimplifyRequest,
  StepsRequest,
  SummarizeRequest,
} from "@/backend";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const chatHistoryKey = ["chatHistory"] as const;
export const settingsKey = ["mySettings"] as const;

/* ------------------------------------------------------------------ */
/* Queries                                                             */
/* ------------------------------------------------------------------ */

/** The caller's saved conversation history, oldest first. */
export function useChatHistory() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: chatHistoryKey,
    queryFn: async () => {
      if (!actor) return [];
      return actor.getChatHistory();
    },
    enabled: !!actor && !isFetching,
  });
}

/** The caller's persisted module + accessibility preferences. */
export function useMySettings() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: settingsKey,
    queryFn: async () => {
      if (!actor) return null;
      return actor.getMySettings();
    },
    enabled: !!actor && !isFetching,
  });
}

/* ------------------------------------------------------------------ */
/* Mutations                                                           */
/* ------------------------------------------------------------------ */

/** Send a chat message and persist both turns. */
export function useChat() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (request: ChatRequest) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.chat(request);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: chatHistoryKey });
    },
  });
}

/** Remove all saved conversation history for the caller. */
export function useClearChatHistory() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.clearChatHistory();
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: chatHistoryKey });
    },
  });
}

/** Persist the caller's selected assistance module. */
export function useSetSelectedModule() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (module: AssistanceModule) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.setSelectedModule(module);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: settingsKey });
    },
  });
}

/** Persist the caller's accessibility preferences. */
export function useSetAccessibilityPreferences() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (preferences: AccessibilityPreferences) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.setAccessibilityPreferences(preferences);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: settingsKey });
    },
  });
}

/** Simplify complex text into easy-to-understand language. */
export function useSimplifyText() {
  const { actor } = useActor(createActor);
  return useMutation({
    mutationFn: async (request: SimplifyRequest) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.simplifyText(request);
    },
  });
}

/** Summarize text into key points. */
export function useSummarizeText() {
  const { actor } = useActor(createActor);
  return useMutation({
    mutationFn: async (request: SummarizeRequest) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.summarizeText(request);
    },
  });
}

/** Turn a task description into ordered steps. */
export function useGenerateSteps() {
  const { actor } = useActor(createActor);
  return useMutation({
    mutationFn: async (request: StepsRequest) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.generateSteps(request);
    },
  });
}

/** Describe an uploaded image: notable objects and readable text. */
export function useDescribeImage() {
  const { actor } = useActor(createActor);
  return useMutation({
    mutationFn: async (request: DescribeImageRequest) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.describeImage(request);
    },
  });
}

export type { ChatContextTurn };
