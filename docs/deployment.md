# Phase 2 deployment

This project has its own GitHub repository, `PenielOkoli/coinpilot-ai-phase-2`, and its own Vercel project. Do not link it to the Phase 1 Vercel project.

Use Node.js 22.x, the Next.js preset, `npm ci`, and `npm run build`. No environment variables are needed for the approved streaming demo.

```bash
npm ci
npm run check
npm run test:e2e
npx vercel --prod
```

For a fresh clone, import the Phase 2 repository into a new Vercel project. Production pushes are deployed through the repository connection. The optional `ANTHROPIC_*` placeholders do not enable live inference; the current public route always uses sample content.

After deployment, set `TEST_BASE_URL` to the actual production URL and run `npm run test:e2e` to verify the deployed chat and Server Actions. Also read the endpoint incrementally to confirm deltas arrive before its final finish event. The live URL is recorded in README after it is confirmed.
