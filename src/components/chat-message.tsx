"use client";
import { useState } from "react";
import {
  Check,
  Copy,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import {
  messageText,
  type ChatMessage,
  type Delivery,
  type Feedback,
} from "@/lib/chat-contract";

export function UserMessage({ message }: { message: ChatMessage }) {
  return (
    <article className="message user" aria-label="Your message">
      <div className="message-label">You</div>
      <p>{messageText(message)}</p>
    </article>
  );
}
export function AssistantMessage({
  message,
  delivery,
  active,
  last,
  busy,
  feedback,
  onRate,
  onRegenerate,
  onNotice,
}: {
  message: ChatMessage;
  delivery?: Delivery;
  active: boolean;
  last: boolean;
  busy: boolean;
  feedback?: Feedback;
  onRate: (value: Feedback) => void;
  onRegenerate: () => void;
  onNotice: (text: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const text = messageText(message);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      onNotice("Response copied to clipboard.");
    } catch {
      setCopied(false);
      onNotice(
        "Copy failed. Select the response text and copy it with your keyboard.",
      );
    }
  }
  return (
    <article
      className={`message assistant ${message.metadata?.mode === "safety" ? "safety-message" : ""}`}
      aria-label="CoinPilot response"
      data-testid="assistant-message"
      data-delivery={active ? "streaming" : (delivery ?? "stopped")}
    >
      <div className="message-label">
        <Sparkles size={14} />
        CoinPilot
        <span>
          {message.metadata?.mode === "safety"
            ? "Safety fallback"
            : message.metadata?.mode === "degraded"
              ? "Verification unavailable"
              : "Streaming demo"}
        </span>
      </div>
      {message.metadata?.mode === "safety" && (
        <div className="safety-heading">
          <ShieldCheck size={15} /> Let’s keep this safe.
        </div>
      )}
      <p data-testid="assistant-text">
        {text ||
          (active
            ? "Waiting for the first words…"
            : "No response text received.")}
        {active && text && <span className="stream-caret" aria-hidden="true" />}
      </p>
      {!active &&
        (delivery === "stopped" || delivery === "error" || !delivery) && (
          <span className="partial-label">
            Partial response ·{" "}
            {delivery === "error" ? "connection interrupted" : "stopped"}
          </span>
        )}
      {message.metadata && (
        <div className="source-note">
          Source: {message.metadata.source}
          <br />
          Confidence: not assessed
        </div>
      )}
      <div className="message-actions">
        <button
          onClick={copy}
          disabled={!text || active}
          aria-label={copied ? "Copy response again" : "Copy response"}
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? "Copied" : "Copy"}
        </button>
        <button
          aria-label="Helpful response"
          aria-pressed={feedback === "helpful"}
          disabled={active || !text}
          onClick={() => onRate("helpful")}
        >
          <ThumbsUp size={13} />
        </button>
        <button
          aria-label="Unhelpful response"
          aria-pressed={feedback === "unhelpful"}
          disabled={active || !text}
          onClick={() => onRate("unhelpful")}
        >
          <ThumbsDown size={13} />
        </button>
        {last && (
          <button onClick={onRegenerate} disabled={busy}>
            <RotateCcw size={13} />
            Regenerate
          </button>
        )}
      </div>
    </article>
  );
}
export function StatusMessage({
  text,
  announcement,
}: {
  text: string;
  announcement: string;
}) {
  return (
    <div
      className="conversation-status"
      role="status"
      aria-live="polite"
      aria-atomic="true"
      data-testid="chat-status"
    >
      <span className="status-dot" aria-hidden="true" />
      {text}
      <span className="sr-only">{announcement ? ` ${announcement}` : ""}</span>
    </div>
  );
}
export function ErrorMessage({
  retry,
  busy,
}: {
  retry: () => void;
  busy: boolean;
}) {
  return (
    <div className="chat-error">
      <p role="alert">
        The response could not finish. Your question and any partial answer are
        kept.
      </p>
      <button className="secondary-button" onClick={retry} disabled={busy}>
        <RotateCcw size={14} />
        Retry response
      </button>
      <small>Retry uses the normal demo scenario.</small>
    </div>
  );
}
