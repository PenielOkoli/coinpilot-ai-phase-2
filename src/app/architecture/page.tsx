import Link from "next/link";
import { ArrowLeft, ArrowRight, Compass, ShieldCheck } from "lucide-react";
export const metadata = { title: "Streaming architecture — CoinPilot Phase 2" };
export default function ArchitecturePage() {
  return (
    <main id="main" className="architecture-page">
      <Link href="/" className="back-link">
        <ArrowLeft size={16} />
        Back to workspace
      </Link>
      <div className="brand-mark">
        <Compass />
      </div>
      <span className="eyebrow">PHASE 2 · STREAMING CONVERSATIONS</span>
      <h1>
        A conversation.
        <br />
        At your pace.
      </h1>
      <p className="architecture-intro">
        Progressive answers, recoverable interruptions, and clear status updates
        bring the CoinPilot foundation to life.
      </p>
      <div className="boundary-flow">
        <div>
          <span>01</span>
          <h2>You ask</h2>
          <p>
            React holds the draft. The AI SDK sends a bounded conversation to
            the server.
          </p>
        </div>
        <ArrowRight />
        <div>
          <span>02</span>
          <h2>The server streams</h2>
          <p>
            Validated input becomes sample text, delivered incrementally over
            Server-Sent Events.
          </p>
        </div>
        <ArrowRight />
        <div>
          <span>03</span>
          <h2>You stay in control</h2>
          <p>
            Stop, retry, regenerate, copy, and rate an answer. Partial output
            stays visible.
          </p>
        </div>
      </div>
      <section>
        <h2>Fast, understandable, accessible</h2>
        <dl>
          <dt>Fast means progressive</dt>
          <dd>
            Words render as network chunks arrive. This is a real stream of demo
            content, not a typing effect applied to a completed response.
          </dd>
          <dt>Understandable means recoverable</dt>
          <dd>
            Connecting, receiving, stopped, error and complete states have clear
            labels. Retry reuses the question. Regenerate replaces the last
            answer.
          </dd>
          <dt>Accessible means deliberate</dt>
          <dd>
            Enter sends, Shift+Enter adds a line, and Escape in the composer
            stops. A polite status region announces meaningful changes and
            completed answers without reading every token. Streaming does not
            steal focus.
          </dd>
        </dl>
      </section>
      <section>
        <h2>History with a clear choice</h2>
        <p>
          Conversation history stays in memory across workspace views. Opt into
          “Remember demo in this tab” to save the sample conversation and
          feedback across refreshes. Clear conversation removes old messages.
          This browser storage is for the teaching demo only; do not enter
          personal details, wallet credentials, or private trading information.
        </p>
      </section>
      <section>
        <h2>Try the difficult states</h2>
        <p>
          Open “Try a conversation state” below the composer to simulate a
          failure before the response, a connection lost mid-response,
          unavailable market data, or a safety fallback. Retry returns to normal
          streaming.
        </p>
        <p>
          The safety guard is a small teaching example, not a production
          moderation system. All responses and market data are samples. No model
          provider, wallet, or exchange is called.
        </p>
      </section>
      <div className="architecture-callout">
        <ShieldCheck />
        <p>
          This is an independent Phase 2 project. The server/client boundaries
          and validated preference and proposal actions continue from Phase 1.
        </p>
      </div>
      <p className="architecture-intro">
        <a href="https://github.com/PenielOkoli/coinpilot-ai-phase-2/blob/main/docs/accessibility.md">
          Read the accessibility evidence and manual screen-reader checklist →
        </a>
      </p>
    </main>
  );
}
