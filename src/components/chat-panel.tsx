"use client";
import { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUpRight,
  Compass,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Square,
} from "lucide-react";
import type { Scenario } from "@/lib/chat-contract";
import type { ConversationController } from "./use-conversation";
import {
  AssistantMessage,
  ErrorMessage,
  StatusMessage,
  UserMessage,
} from "./chat-message";

export function ChatPanel({ chat }: { chat: ConversationController }) {
  const scroller = useRef<HTMLDivElement>(null);
  const follow = useRef(true);
  const [showLatest, setShowLatest] = useState(false);
  const last = chat.messages.at(-1);
  const unanswered = last?.role === "user";
  const pendingRecovery =
    !chat.busy &&
    (unanswered ||
      (last?.role === "assistant" && chat.deliveries[last.id] !== "complete"));
  useEffect(() => {
    if (follow.current && scroller.current)
      scroller.current.scrollTop = scroller.current.scrollHeight;
  }, [chat.messages, chat.status]);
  const status =
    chat.status === "submitted"
      ? "Connecting… You can stop at any time."
      : chat.status === "streaming"
        ? "Receiving response…"
        : chat.notice;
  return (
    <section
      className="panel copilot-panel phase-two-chat"
      aria-labelledby="copilot-title"
    >
      <div className="panel-heading">
        <div className="heading-with-icon">
          <span className="icon-tile">
            <Sparkles size={19} />
          </span>
          <div>
            <h2 id="copilot-title">Your AI copilot</h2>
            <p>A conversation that moves at your pace.</p>
          </div>
        </div>
        <span className="pill">
          <span className="status-dot" />
          Streaming demo
        </span>
      </div>
      <div className="chat-context">
        <ShieldCheck size={14} />
        <span>
          Sample responses. No trades or live market data. Keep personal details
          and credentials out of chat.
        </span>
      </div>
      <div
        className="chat-content"
        role="log"
        aria-live="off"
        aria-label="Copilot conversation"
        aria-busy={chat.busy}
        tabIndex={0}
        ref={scroller}
        onScroll={() => {
          const el = scroller.current;
          if (el) {
            follow.current =
              el.scrollHeight - el.scrollTop - el.clientHeight < 70;
            setShowLatest(!follow.current);
          }
        }}
      >
        {chat.messages.length === 0 ? (
          <div className="chat-welcome">
            <div className="orb">
              <Sparkles size={27} strokeWidth={1.5} />
            </div>
            <h3>Let’s talk it through.</h3>
            <p>
              Follow an idea. Ask a second question.
              <br />
              Pause whenever you need a moment.
            </p>
            <div className="prompt-list">
              {[
                "Explain the BTC signal",
                "Review my portfolio risk",
                "How does proposal review work?",
              ].map((prompt, index) => (
                <button
                  key={prompt}
                  disabled={chat.busy || !chat.hydrated}
                  onClick={() => void chat.send(prompt)}
                >
                  <span>
                    {index === 0 ? (
                      <Compass size={16} />
                    ) : index === 1 ? (
                      <ShieldCheck size={16} />
                    ) : (
                      <MessageSquare size={16} />
                    )}
                    {prompt}
                  </span>
                  <ArrowUpRight size={15} />
                </button>
              ))}
            </div>
          </div>
        ) : (
          chat.messages.map((message) =>
            message.role === "user" ? (
              <UserMessage key={message.id} message={message} />
            ) : (
              <AssistantMessage
                key={message.id}
                message={message}
                delivery={chat.deliveries[message.id]}
                active={chat.busy && message.id === last?.id}
                last={message.id === last?.id}
                busy={chat.busy}
                feedback={chat.feedback[message.id]}
                onRate={(value) => chat.rate(message.id, value)}
                onRegenerate={() => void chat.regenerate()}
                onNotice={(text) => {
                  chat.setNotice(text);
                  chat.setAnnouncement("");
                }}
              />
            ),
          )
        )}
      </div>
      {showLatest && (
        <button
          className="jump-latest"
          onClick={() => {
            follow.current = true;
            setShowLatest(false);
            if (scroller.current)
              scroller.current.scrollTop = scroller.current.scrollHeight;
          }}
        >
          <ArrowDown size={13} />
          Jump to latest
        </button>
      )}
      <StatusMessage
        text={status}
        announcement={chat.busy ? "" : chat.announcement}
      />
      {chat.error && (
        <ErrorMessage
          busy={chat.busy}
          retry={() => void chat.regenerate(true)}
        />
      )}
      {!chat.error && pendingRecovery && (
        <div className="recovery-bar">
          <span>
            {unanswered
              ? "This question has no completed answer."
              : "You can request a fresh answer."}
          </span>
          <button onClick={() => void chat.regenerate(true)}>
            Retry response
          </button>
        </div>
      )}
      <div className="composer-area">
        <form
          className="composer"
          onSubmit={(event) => {
            event.preventDefault();
            void chat.send(chat.draft);
          }}
        >
          <label className="sr-only" htmlFor="question">
            Ask CoinPilot
          </label>
          <textarea
            id="question"
            ref={(node) => chat.bindInput(node)}
            rows={2}
            value={chat.draft}
            onChange={(event) => chat.setDraft(event.target.value)}
            placeholder="Ask about a signal or your portfolio…"
            maxLength={1000}
            aria-describedby="composer-help"
            onKeyDown={(event) => {
              if (event.key === "Escape" && chat.busy) {
                event.preventDefault();
                chat.stop();
              }
              if (
                event.key === "Enter" &&
                !event.shiftKey &&
                !event.nativeEvent.isComposing
              ) {
                event.preventDefault();
                void chat.send(chat.draft);
              }
            }}
          />
          {chat.busy ? (
            <button
              type="button"
              className="send-button stop-button"
              onClick={chat.stop}
              aria-label="Stop response"
            >
              <Square size={14} fill="currentColor" />
            </button>
          ) : (
            <button
              type="submit"
              className="send-button"
              aria-label="Send message"
              disabled={
                !chat.hydrated ||
                !chat.draft.trim() ||
                unanswered ||
                chat.messages.length >= 40
              }
            >
              <ArrowUpRight size={20} />
            </button>
          )}
        </form>
        <div className="composer-footer" id="composer-help">
          <span>Enter to send · Shift+Enter for a new line · Esc to stop</span>
          <span>{chat.draft.length}/1000</span>
        </div>
        <div className="chat-controls">
          <label>
            <input
              type="checkbox"
              checked={chat.remember}
              disabled={!chat.hydrated}
              onChange={(event) => chat.rememberHistory(event.target.checked)}
            />
            Remember demo in this tab
          </label>
          <button disabled={chat.busy} onClick={chat.reset}>
            Clear conversation
          </button>
        </div>
        <p className="history-note">
          {chat.remember
            ? "History and feedback are saved in this tab’s session storage. Clear conversation removes the saved messages."
            : "History stays in memory unless you opt in. Feedback stays in this demo only."}
        </p>
        {chat.storageError && (
          <p className="form-error" role="alert">
            {chat.storageError}
          </p>
        )}
        <details className="demo-lab">
          <summary>Try a conversation state</summary>
          <label htmlFor="scenario">Next response</label>
          <select
            id="scenario"
            value={chat.scenario}
            disabled={chat.busy}
            onChange={(event) =>
              chat.setScenario(event.target.value as Scenario)
            }
          >
            <option value="normal">Normal streaming</option>
            <option value="outage">Market data unavailable</option>
            <option value="connection-error">
              Connection error before response
            </option>
            <option value="interrupted">Connection lost mid-response</option>
            <option value="safety">Safety fallback</option>
          </select>
          <p>
            These deliberate simulations make each interaction testable. Retry
            returns to normal streaming.
          </p>
        </details>
      </div>
    </section>
  );
}
