# Phase 2 security checklist

- [x] Provider keys are not needed for the submission. The server-only Anthropic adapter remains inactive.
- [x] `.env*` and `.vercel/` are ignored; `.env.example` contains blank placeholders only.
- [x] The public route never invokes paid inference or an exchange.
- [x] Request JSON is bounded by actual bytes and validated for roles, turn ordering, lengths, scenario and variation. Unknown fields are rejected.
- [x] The route rejects unexpected media types and cross-origin browser requests when Origin is present. This is not authentication.
- [x] Responses carry only server-authored sample provenance and unassessed confidence.
- [x] Output is rendered as React text; no raw HTML or arbitrary links are injected.
- [x] Client cancellation aborts the request; the server stream respects cancellation and request aborts. The client has a timeout.
- [x] No application logging of conversation content or secrets is introduced.
- [x] Storage is opt-in session storage for this teaching demo, with bounded schema-validated restoration and recovery from storage errors.
- [x] The UI says not to enter credentials or personal details. Session storage is not encrypted or secure against same-origin scripts.
- [x] Clear conversation removes old saved messages; disabling remembering removes the stored snapshot.
- [x] Feedback is local and is described as local. No analytics transmission is implied.
- [x] Sample proposal review retains its server validation and cannot place a trade.
- [x] Fonts remain locally bundled, and the Phase 1 security headers remain enabled.
- [ ] Before real AI: authenticate users, enforce durable quotas/spending limits, validate provider configuration, minimize context, and test provider errors.
- [ ] Before sensitive history: authenticated server storage, ownership checks, retention and deletion policies.
- [ ] Before production moderation: use a tested policy/classifier and structured safety handling. The current narrow keyword guard only demonstrates UI states.
- [ ] Before real trading: exact proposal binding, expiring single-use approval, idempotency and audit records.
- [ ] Before production hardening: CSP and a full accessibility/security review.

Dependency audits, TypeScript, route tests, and browser checks are run before publication; see the assessment record for results.
