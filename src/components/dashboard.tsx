"use client";

import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  ChevronRight,
  CircleHelp,
  Compass,
  FlaskConical,
  LayoutDashboard,
  Plus,
  Settings2,
  ShieldCheck,
  Sparkles,
  Wallet,
  X,
} from "lucide-react";
import { reviewProposal, savePreferences } from "@/app/actions";
import type { MarketAsset, Proposal, RiskTolerance } from "@/types/domain";

import { ChatPanel } from "./chat-panel";
import { useConversation } from "./use-conversation";

type View = "overview" | "copilot" | "portfolio" | "settings";
const money = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    value,
  );

function Sparkline({
  values,
  negative = false,
}: {
  values: number[];
  negative?: boolean;
}) {
  return (
    <svg
      className={`sparkline ${negative ? "negative" : ""}`}
      viewBox="0 0 120 48"
      aria-hidden="true"
    >
      <polyline
        points={values.map((v, i) => `${i * 10.8},${54 - v * 0.7}`).join(" ")}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Dashboard({
  assets,
  proposal,
  initialRisk,
}: {
  assets: MarketAsset[];
  proposal: Proposal;
  initialRisk: RiskTolerance;
}) {
  const [view, setView] = useState<View>("overview");
  const conversation = useConversation();
  const [reviewStatus, setReviewStatus] = useState(proposal.status);
  const [acknowledged, setAcknowledged] = useState(false);
  const [reviewNote, setReviewNote] = useState("");
  const [reviewPending, startReview] = useTransition();
  const [preferenceState, preferenceAction, preferencePending] = useActionState(
    savePreferences,
    null,
  );
  const nav = [
    { id: "overview" as const, label: "Overview", icon: LayoutDashboard },
    { id: "copilot" as const, label: "AI Copilot", icon: Sparkles },
    { id: "portfolio" as const, label: "Portfolio", icon: Wallet },
    { id: "settings" as const, label: "Preferences", icon: Settings2 },
  ];

  function review(decision: "approve" | "reject") {
    startReview(async () => {
      try {
        const result = await reviewProposal({
          proposalId: proposal.id,
          decision,
          acknowledged,
        });
        setReviewNote(result.message);
        if (result.ok) setReviewStatus(result.data);
      } catch {
        setReviewNote("Review could not be submitted. Please try again.");
      }
    });
  }

  const chat = <ChatPanel chat={conversation} />;

  const portfolio = (
    <section
      className="panel portfolio-panel"
      aria-labelledby="portfolio-title"
    >
      <div className="panel-heading">
        <h2 id="portfolio-title">Portfolio snapshot</h2>
        <span className="muted-label">SAMPLE</span>
      </div>
      <div className="portfolio-value">
        <span>Total balance</span>
        <strong>
          $24,680<span>.00</span>
        </strong>
        <p>Illustrative holdings · USD</p>
      </div>
      <div
        className="allocation-bar"
        aria-label="Allocation: Bitcoin 45 percent, Ethereum 30 percent, Solana 25 percent"
      >
        <span />
        <span />
        <span />
      </div>
      <div className="allocation-list">
        {assets.map((asset) => (
          <div key={asset.symbol}>
            <span>
              <i className={`dot ${asset.symbol.toLowerCase()}`} />
              {asset.name}
              <small>{asset.symbol}</small>
            </span>
            <strong>{asset.allocation}%</strong>
          </div>
        ))}
      </div>
      <div className="portfolio-insight">
        <ShieldCheck size={17} />
        <p>
          <strong>Built around your comfort zone.</strong>
          <br />
          Risk preference:{" "}
          <b>{preferenceState?.ok ? preferenceState.data : initialRisk}</b>
        </p>
      </div>
    </section>
  );

  const proposalCard = (
    <section className="panel proposal-panel" aria-labelledby="proposal-title">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">HUMAN IN THE LOOP</span>
          <h2 id="proposal-title">One thing to review</h2>
        </div>
        <span className="review-count">01</span>
      </div>
      <div className="proposal-body">
        <span className="risk-badge">Medium risk · Sample proposal</span>
        <h3>{proposal.title}</h3>
        <p>{proposal.reasoning}</p>
        {reviewStatus === "awaiting-review" ? (
          <>
            <label className="acknowledgement">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(event) => setAcknowledged(event.target.checked)}
              />{" "}
              I understand this approval is a demo and cannot execute a trade.
            </label>
            <div className="review-actions">
              <button
                className="primary-button"
                disabled={!acknowledged || reviewPending}
                onClick={() => review("approve")}
              >
                <Check size={16} />
                {reviewPending ? "Submitting…" : "Approve demo"}
              </button>
              <button
                className="secondary-button"
                disabled={reviewPending}
                onClick={() => review("reject")}
              >
                <X size={16} />
                Reject
              </button>
            </div>
          </>
        ) : (
          <div className="review-complete">
            <Check size={17} />{" "}
            {reviewStatus === "approved-demo"
              ? "Demo approved"
              : "Demo rejected"}
            <button
              onClick={() => {
                setReviewStatus("awaiting-review");
                setAcknowledged(false);
                setReviewNote("");
              }}
            >
              Reset demo
            </button>
          </div>
        )}
        {reviewNote && (
          <p className="review-note" role="status">
            {reviewNote}
          </p>
        )}
      </div>
      <div className="panel-footnote">
        <ShieldCheck size={13} /> A suggestion is never an executed action.
      </div>
    </section>
  );

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="brand" href="/">
          <span className="brand-mark">
            <Compass size={23} />
          </span>
          <span>
            coinpilot<span className="brand-ai">AI</span>
          </span>
        </Link>
        <div className="workspace-label">YOUR WORKSPACE</div>
        <nav aria-label="Main navigation">
          {nav.map((item) => (
            <button
              key={item.id}
              className={view === item.id ? "nav-item active" : "nav-item"}
              aria-current={view === item.id ? "page" : undefined}
              onClick={() => setView(item.id)}
            >
              <item.icon size={18} />
              {item.label}
              {item.id === "copilot" && <span className="nav-new">NEW</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="guard-card">
            <span>
              <ShieldCheck size={19} /> Your call. Always.
            </span>
            <p>
              Intelligence to guide you.
              <br />
              Control that stays with you.
            </p>
            <span className="guard-line" />
          </div>
          <a className="help-link" href="/architecture">
            <CircleHelp size={17} /> How CoinPilot works
            <ArrowUpRight size={14} />
          </a>
          <div className="profile">
            <div className="avatar">CP</div>
            <div>
              <strong>Demo workspace</strong>
              <span>Phase 2 · Conversations</span>
            </div>
            <span className="profile-dot" />
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            Workspace
            <ChevronRight size={14} />
            <strong>{nav.find((item) => item.id === view)?.label}</strong>
          </div>
          <div className="topbar-right">
            <span className="demo-badge">
              <FlaskConical size={13} /> Demo environment
            </span>
            <a href="/architecture" className="docs-link">
              Architecture notes
              <ArrowUpRight size={14} />
            </a>
          </div>
        </header>
        <main id="main">
          <div className="page-heading">
            <div>
              <div className="eyebrow">CLARITY BEFORE ACTION</div>
              <h1>
                {view === "overview"
                  ? "Your next move, understood."
                  : view === "copilot"
                    ? "A clearer view starts here."
                    : view === "portfolio"
                      ? "See the bigger picture."
                      : "Make this space yours."}
              </h1>
              <p>
                {view === "settings"
                  ? "Set the context for how you think about risk."
                  : "Less noise. More context. A copilot that keeps you in control."}
              </p>
            </div>
            <button
              className="new-chat"
              onClick={() => {
                setView("copilot");
                conversation.reset();
              }}
              disabled={conversation.busy}
            >
              <Plus size={16} />
              New conversation
            </button>
          </div>
          <div className="demo-notice">
            <FlaskConical size={15} />
            <p>
              <strong>A safe space to explore.</strong> Prices, holdings, and
              responses are examples. No live data, connected wallet, or real
              trades.
            </p>
            <span>PHASE 02</span>
          </div>
          {view === "overview" && (
            <>
              <div className="section-heading">
                <h2>Market at a glance</h2>
                <span>
                  Illustrative snapshot <span className="tiny-dot">·</span> 01
                  Oct 2026
                </span>
              </div>
              <div className="market-grid">
                {assets.map((asset) => (
                  <article className="market-card" key={asset.symbol}>
                    <div className="market-top">
                      <div className="asset-name">
                        <span
                          className={`coin-icon ${asset.symbol.toLowerCase()}`}
                        >
                          {asset.symbol === "BTC"
                            ? "₿"
                            : asset.symbol === "ETH"
                              ? "Ξ"
                              : "≋"}
                        </span>
                        <h3>
                          {asset.name}
                          <span>{asset.symbol}</span>
                        </h3>
                      </div>
                      <ArrowUpRight size={16} className="muted-icon" />
                    </div>
                    <div className="market-bottom">
                      <div>
                        <strong>{money(asset.price)}</strong>
                        <p className={asset.change < 0 ? "loss" : "gain"}>
                          {asset.change < 0 ? (
                            <ArrowDownLeft size={13} />
                          ) : (
                            <ArrowUpRight size={13} />
                          )}
                          {Math.abs(asset.change).toFixed(2)}%{" "}
                          <span>sample 24h</span>
                        </p>
                      </div>
                      <Sparkline
                        values={asset.trend}
                        negative={asset.change < 0}
                      />
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
          {view === "overview" && (
            <div className="dashboard-grid">
              <div>{chat}</div>
              <div className="right-column">
                {portfolio}
                {proposalCard}
              </div>
            </div>
          )}
          {view === "copilot" && (
            <div className="dashboard-grid chat-view">
              <div>{chat}</div>
              <div className="right-column">
                {proposalCard}
                <div className="quiet-note">
                  <ShieldCheck size={22} />
                  <h3>Answers with context.</h3>
                  <p>
                    Each demo answer names its source and marks confidence as
                    not assessed. Open the conversation-state controls to try
                    interruptions and safety fallbacks.
                  </p>
                </div>
              </div>
            </div>
          )}
          {view === "portfolio" && (
            <div className="dashboard-grid portfolio-view">
              <div>
                {portfolio}
                <section className="panel holdings-panel">
                  <h2>Sample holdings</h2>
                  <table>
                    <thead>
                      <tr>
                        <th>Asset</th>
                        <th>Allocation</th>
                        <th>Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assets.map((asset) => (
                        <tr key={asset.symbol}>
                          <td>
                            {asset.name} <span>{asset.symbol}</span>
                          </td>
                          <td>{asset.allocation}%</td>
                          <td>{money((24680 * asset.allocation) / 100)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p>Illustrative values only. No wallet is connected.</p>
                </section>
              </div>
              <div>{proposalCard}</div>
            </div>
          )}
          {view === "settings" && (
            <section className="panel settings-panel">
              <span className="icon-tile">
                <Settings2 size={20} />
              </span>
              <h2>Your risk preference</h2>
              <p>
                This preference helps frame the workspace. It does not trigger a
                recommendation or trade.
              </p>
              <form action={preferenceAction}>
                <fieldset>
                  <legend>Choose your comfort level</legend>
                  {(["cautious", "balanced", "adventurous"] as const).map(
                    (risk) => (
                      <label className="risk-option" key={risk}>
                        <input
                          type="radio"
                          name="riskTolerance"
                          value={risk}
                          defaultChecked={initialRisk === risk}
                        />
                        <span>
                          <strong>{risk}</strong>
                          <small>
                            {risk === "cautious"
                              ? "Focus on understanding downside and uncertainty."
                              : risk === "balanced"
                                ? "Consider opportunities alongside potential downside."
                                : "Explore volatility with clear awareness of the risks."}
                          </small>
                        </span>
                      </label>
                    ),
                  )}
                </fieldset>
                <button className="primary-button" disabled={preferencePending}>
                  <Check size={16} />
                  {preferencePending ? "Saving…" : "Save preference"}
                </button>
                <p className="settings-status" role="status">
                  {preferenceState?.message}
                </p>
              </form>
              <div className="settings-detail">
                <ShieldCheck size={16} />
                <p>
                  Saved in a validated, HttpOnly cookie for 7 days. No account,
                  financial details, or conversation history is stored.
                </p>
              </div>
            </section>
          )}
          <footer className="page-footer">
            <span>
              <ShieldCheck size={13} /> Designed for informed decisions.
            </span>
            <span>
              CoinPilot AI <span className="tiny-dot">·</span> Phase 2 streaming
              chat
            </span>
          </footer>
        </main>
      </div>
    </div>
  );
}
