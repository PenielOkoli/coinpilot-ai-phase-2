"use client";
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="loading-page">
      <h1>Your workspace could not load.</h1>
      <p>Please try again.</p>
      <button onClick={reset}>Try again</button>
    </main>
  );
}
