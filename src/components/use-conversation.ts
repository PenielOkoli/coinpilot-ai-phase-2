"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  chatMetadataSchema,
  messageText,
  restoreConversation,
  STORAGE_KEY,
  type ChatMessage,
  type Delivery,
  type Feedback,
  type Scenario,
} from "@/lib/chat-contract";

export function useConversation() {
  const [draft, setDraft] = useState("");
  const [scenario, setScenario] = useState<Scenario>("normal");
  const [deliveries, setDeliveries] = useState<Record<string, Delivery>>({});
  const [feedback, setFeedback] = useState<Record<string, Feedback>>({});
  const [notice, setNotice] = useState("Ready when you are.");
  const [announcement, setAnnouncement] = useState("");
  const [remember, setRemember] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [storageError, setStorageError] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const locked = useRef(false);
  const revision = useRef(0);
  const userStopped = useRef(false);
  const transport = useMemo(
    () =>
      new DefaultChatTransport<ChatMessage>({
        api: "/api/chat",
        fetch: (url, options) =>
          fetch(url, {
            ...options,
            signal: AbortSignal.any([
              ...(options?.signal ? [options.signal] : []),
              AbortSignal.timeout(20000),
            ]),
          }),
        prepareSendMessagesRequest: ({ messages, body }) => {
          // Send only bounded text roles; never accept system prompts or tool parts.
          const turns = messages
            .filter((m) => m.role !== "system")
            .slice(-10)
            .map((m) => ({
              role: m.role,
              content: (
                messageText(m) || "(Response interrupted before text arrived.)"
              ).slice(0, m.role === "user" ? 1000 : 2000),
            }));
          return {
            body: {
              messages: turns,
              scenario: body?.scenario ?? "normal",
              variation: body?.variation ?? 0,
            },
          };
        },
      }),
    [],
  );
  const chat = useChat<ChatMessage>({
    transport,
    messageMetadataSchema: chatMetadataSchema,
    onFinish: ({ message, isAbort, isDisconnect, isError }) => {
      const delivery: Delivery =
        isAbort || userStopped.current
          ? "stopped"
          : isDisconnect || isError
            ? "error"
            : "complete";
      setDeliveries((previous) => ({ ...previous, [message.id]: delivery }));
      if (delivery === "complete") {
        setNotice(
          message.metadata?.mode === "safety"
            ? "Safety guidance ready."
            : "Response complete.",
        );
        setAnnouncement(messageText(message));
      } else
        setNotice(
          delivery === "stopped"
            ? "Response stopped. Partial text is kept."
            : "Response interrupted. Partial text is kept.",
        );
    },
    onError: () => {
      setNotice("The response could not finish. Retry when you are ready.");
      setAnnouncement("");
    },
  });
  const { setMessages, clearError } = chat;
  const busy = chat.status === "submitted" || chat.status === "streaming";

  useEffect(() => {
    let active = true;
    // Restore external browser storage after hydration, never during SSR.
    queueMicrotask(() => {
      if (!active) return;
      try {
        const saved = restoreConversation(sessionStorage.getItem(STORAGE_KEY));
        if (saved) {
          setMessages(saved.messages);
          setDeliveries(saved.deliveries);
          setFeedback(saved.feedback);
          setRemember(true);
          setNotice("Demo conversation restored in this tab.");
        }
      } catch {
        setStorageError(
          "Saved history is unavailable or invalid. You can still chat in memory.",
        );
      }
      setHydrated(true);
    });
    return () => {
      active = false;
    };
  }, [setMessages]);

  useEffect(() => {
    if (!hydrated || !remember) return;
    // Persist a bounded snapshot after each rendered update, including partial output.
    const timer = setTimeout(() => {
      try {
        const messages = chat.messages
          .slice(-40)
          .map((m) => ({
            ...m,
            parts: m.parts.filter((p) => p.type === "text"),
          }));
        const ids = new Set(messages.map((m) => m.id));
        sessionStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            version: 2,
            messages,
            deliveries: Object.fromEntries(
              Object.entries(deliveries).filter(([id]) => ids.has(id)),
            ),
            feedback: Object.fromEntries(
              Object.entries(feedback).filter(([id]) => ids.has(id)),
            ),
          }),
        );
      } catch {
        setStorageError(
          "This browser could not save history. Your current conversation is still available.",
        );
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [chat.messages, deliveries, feedback, remember, hydrated, busy]);

  function rememberHistory(enabled: boolean) {
    setRemember(enabled);
    setStorageError("");
    if (!enabled) {
      try {
        sessionStorage.removeItem(STORAGE_KEY);
      } catch {
        setStorageError(
          "Browser storage could not be cleared. Clear this site’s data in your browser settings.",
        );
      }
    }
  }
  function focusInput() {
    requestAnimationFrame(() => inputRef.current?.focus());
  }
  async function send(text: string) {
    const trimmed = text.trim();
    if (
      locked.current ||
      busy ||
      !hydrated ||
      !trimmed ||
      trimmed.length > 1000
    )
      return;
    if (chat.messages.length >= 40) {
      setNotice(
        "This conversation has reached 20 exchanges. Start a new conversation to continue.",
      );
      return;
    }
    // An unresolved user turn must be retried, not silently inserted into a broken transcript.
    if (chat.messages.at(-1)?.role === "user") {
      setNotice("Retry the unanswered question or start a new conversation.");
      return;
    }
    locked.current = true;
    userStopped.current = false;
    setDraft("");
    setAnnouncement("");
    clearError();
    focusInput();
    try {
      await chat.sendMessage(
        { text: trimmed },
        { body: { scenario, variation: 0 } },
      );
    } finally {
      locked.current = false;
    }
  }
  async function regenerate(retry = false) {
    if (locked.current || busy || !chat.messages.length) return;
    locked.current = true;
    userStopped.current = false;
    setAnnouncement("");
    clearError();
    focusInput();
    const selectedScenario = retry ? "normal" : scenario;
    if (retry) setScenario("normal");
    revision.current = retry ? 0 : (revision.current + 1) % 10000;
    try {
      await chat.regenerate({
        body: {
          scenario: selectedScenario,
          variation: retry ? 0 : revision.current,
        },
      });
    } finally {
      locked.current = false;
    }
  }
  function stop() {
    userStopped.current = true;
    chat.stop();
    setNotice("Response stopped. Partial text is kept.");
    setAnnouncement("");
    const last = chat.messages.at(-1);
    if (last?.role === "assistant")
      setDeliveries((previous) => ({ ...previous, [last.id]: "stopped" }));
    focusInput();
  }
  const reset = useCallback(() => {
    if (locked.current) return;
    setMessages([]);
    clearError();
    setDraft("");
    setDeliveries({});
    setFeedback({});
    setAnnouncement("");
    setNotice("New conversation ready.");
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      setStorageError("Browser storage could not be cleared.");
    }
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [setMessages, clearError]);
  function rate(id: string, value: Feedback) {
    setFeedback((previous) => {
      const next = { ...previous };
      if (next[id] === value) delete next[id];
      else next[id] = value;
      return next;
    });
    setNotice(
      feedback[id] === value
        ? "Feedback removed."
        : "Feedback noted in this demo tab.",
    );
    setAnnouncement("");
  }
  const bindInput = useCallback((node: HTMLTextAreaElement | null) => {
    inputRef.current = node;
  }, []);
  return {
    messages: chat.messages,
    status: chat.status,
    error: chat.error,
    busy,
    draft,
    setDraft,
    scenario,
    setScenario,
    deliveries,
    feedback,
    notice,
    setNotice,
    announcement,
    setAnnouncement,
    remember,
    rememberHistory,
    hydrated,
    storageError,
    bindInput,
    send,
    regenerate,
    stop,
    reset,
    rate,
  };
}
export type ConversationController = ReturnType<typeof useConversation>;
