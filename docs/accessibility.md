# Accessibility evidence — Phase 2

This document separates implementation evidence, automated checks, and manual assistive-technology verification. It does not claim full WCAG conformance.

| Requirement | Implemented behavior | Evidence |
| --- | --- | --- |
| Named controls | Composer has a label; send/stop, copy and feedback icon buttons have accessible names | Semantic locator assertions in `e2e/workspace.spec.ts` |
| Keyboard composition | Enter sends; Shift+Enter inserts a newline; IME composition is excluded from Enter handling | Browser keyboard tests; `isComposing` guard in `chat-panel.tsx` |
| Cancel by keyboard | Escape in the focused composer stops the active response; Stop is also a native button | Browser test checks stopped state and focus |
| Focus continuity | User-initiated controls return focus to the composer; streaming never changes focus | Explicit focus assertions and event-driven focus code |
| Announce progress | One `role=status`, `aria-live=polite`, `aria-atomic=true` region announces connecting, receiving, stopped, or completed state | Browser attribute assertions and visible status checks |
| Avoid token chatter | Conversation `role=log` uses `aria-live=off`; completed answer is added once to the status announcement | DOM semantic tests; token updates do not alter the announcement text |
| Errors and recovery | Error explanation uses `role=alert`; Retry is a named native button | Before-response and mid-response failure browser tests |
| Feedback state | Helpful/Unhelpful buttons expose `aria-pressed`; selection is conveyed beyond color | Browser assertion before and after reload |
| Partial answers | Stopped/interrupted answers have a text label and recoverable controls | Cancellation and interrupted-stream tests |
| Reader-controlled scrolling | The transcript is keyboard-focusable; auto-scroll pauses when scrolled away; Jump to latest is available | Implementation in `chat-panel.tsx`; manual walkthrough below |
| Narrow layout | 390px viewport stays within its width | Automated `scrollWidth <= innerWidth` assertion |
| Reduced motion | Streaming caret animation is disabled by `prefers-reduced-motion` | CSS media query |

## Keyboard walkthrough

1. Reload and use Tab to reach **Skip to content**, then the composer. Check the visible focus outline.
2. Type a question, use Shift+Enter for a second line, and press Enter. The composer remains usable for drafting while a response streams.
3. Press Escape in the composer. Check the stopped notice and partial-answer label.
4. Tab to Retry, press Enter, and confirm focus returns to the composer without losing the question.
5. After completion, use Tab and Enter to copy and rate the answer. The feedback button exposes its pressed state.
6. Focus the conversation log, scroll up with the keyboard, and send a follow-up. Review older text without the stream pulling the scroll position down. Use Jump to latest when ready.

## Screen-reader walkthrough — manual validation still required

With NVDA/Firefox or VoiceOver/Safari, navigate to the labeled composer, send a question, and listen for connecting/receiving status followed by one completed answer. Confirm that token-by-token changes are not spoken repeatedly. Trigger a connection failure and check that the alert and Retry control are understandable. Use browse mode to read user and assistant articles and their source labels.

Automated semantic checks do not verify the actual speech behavior of a screen reader/browser pairing. No human screen-reader session or complete contrast audit is claimed as performed.
