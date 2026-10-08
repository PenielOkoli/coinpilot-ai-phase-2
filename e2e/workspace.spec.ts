import { test, expect, type Page } from "@playwright/test";
const status = (page: Page) => page.getByTestId("chat-status");
const input = (page: Page) =>
  page.getByRole("textbox", { name: "Ask CoinPilot" });
const lastAnswer = (page: Page) => page.getByTestId("assistant-message").last();
async function send(page: Page, text = "Explain the BTC signal") {
  await input(page).fill(text);
  await input(page).press("Enter");
}
async function choose(page: Page, scenario: string) {
  const lab = page.locator("details.demo-lab");
  if ((await lab.getAttribute("open")) === null)
    await page.getByText("Try a conversation state", { exact: true }).click();
  await page.getByLabel("Next response").selectOption(scenario);
}
async function complete(page: Page) {
  await expect(status(page)).toContainText(
    /Response complete|Safety guidance ready/,
    { timeout: 15000 },
  );
}

test("progressive output, cancellation, retry, regeneration and no duplicate questions", async ({
  page,
}) => {
  await page.goto("/");
  await send(page);
  await expect(
    page.getByRole("button", { name: "Stop response" }),
  ).toBeVisible();
  await expect(lastAnswer(page).getByTestId("assistant-text")).toContainText(
    "sample",
  );
  const partial = await lastAnswer(page)
    .getByTestId("assistant-text")
    .innerText();
  await expect
    .poll(
      async () =>
        (await lastAnswer(page).getByTestId("assistant-text").innerText())
          .length,
    )
    .toBeGreaterThan(partial.length);
  await page.getByRole("button", { name: "Stop response" }).click();
  await expect(status(page)).toContainText("stopped");
  await expect(input(page)).toBeFocused();
  await expect(lastAnswer(page)).toContainText("Partial response");
  const stopped = await lastAnswer(page)
    .getByTestId("assistant-text")
    .innerText();
  await page.waitForTimeout(300);
  expect(await lastAnswer(page).getByTestId("assistant-text").innerText()).toBe(
    stopped,
  );
  await page.getByRole("button", { name: "Retry response" }).click();
  await complete(page);
  const first = await lastAnswer(page)
    .getByTestId("assistant-text")
    .innerText();
  await page.getByRole("button", { name: "Regenerate" }).click();
  await complete(page);
  expect(
    await lastAnswer(page).getByTestId("assistant-text").innerText(),
  ).not.toBe(first);
  await expect(page.getByRole("article", { name: "Your message" })).toHaveCount(
    1,
  );
  await expect(page.getByTestId("assistant-message")).toHaveCount(1);
});

test("pre-stream and mid-stream failures recover without losing the question", async ({
  page,
}) => {
  await page.goto("/");
  await choose(page, "connection-error");
  await send(page);
  await expect(page.getByRole("region", { name: "Your AI copilot" }).getByRole("alert")).toContainText("could not finish");
  await page.getByRole("button", { name: "Retry response" }).click();
  await complete(page);
  await expect(page.getByRole("article", { name: "Your message" })).toHaveCount(
    1,
  );
  await choose(page, "interrupted");
  await send(page, "Why does that matter?");
  await expect(page.getByRole("region", { name: "Your AI copilot" }).getByRole("alert")).toContainText("could not finish");
  await expect(lastAnswer(page)).toContainText("Partial response");
  await page.getByRole("button", { name: "Retry response" }).click();
  await complete(page);
  await expect(lastAnswer(page)).toContainText("earlier question");
  await expect(page.getByRole("article", { name: "Your message" })).toHaveCount(
    2,
  );
});

test("opt-in history, local feedback, clipboard and clear survive reload correctly", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/");
  expect(
    await page.evaluate(() => sessionStorage.getItem("coinpilot-phase-2-demo")),
  ).toBeNull();
  await page.getByLabel("Remember demo in this tab").check();
  await send(page);
  await complete(page);
  await page.getByRole("button", { name: "Helpful response", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Helpful response", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page
    .getByRole("button", { name: "Copy response", exact: true })
    .click();
  await expect(status(page)).toContainText("copied");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(
    "sample BTC",
  );
  await page.reload();
  await expect(lastAnswer(page)).toContainText("sample BTC");
  await expect(
    page.getByRole("button", { name: "Helpful response", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Portfolio", exact: true }).click();
  await page.getByRole("button", { name: "AI Copilot" }).click();
  await expect(lastAnswer(page)).toContainText("sample BTC");
  await page.getByRole("button", { name: "Clear conversation" }).click();
  await expect(page.getByTestId("assistant-message")).toHaveCount(0);
  await page.reload();
  await expect(page.getByTestId("assistant-message")).toHaveCount(0);
});

test("keyboard behavior, status semantics, safety and unavailable-data states", async ({
  page,
}) => {
  await page.goto("/");
  await input(page).fill("Line one");
  await input(page).press("Shift+Enter");
  await expect(input(page)).toHaveValue("Line one\n");
  await send(page);
  await expect(
    page.getByRole("button", { name: "Stop response" }),
  ).toBeVisible();
  await input(page).press("Escape");
  await expect(status(page)).toContainText("stopped");
  await expect(input(page)).toBeFocused();
  await page.getByRole("button", { name: "Clear conversation" }).click();
  await choose(page, "safety");
  await send(page, "Can you explain safe signal review?");
  await complete(page);
  await expect(lastAnswer(page)).toContainText("Safety fallback");
  await expect(lastAnswer(page)).toContainText("No action has been taken");
  await expect(status(page)).toHaveAttribute("aria-live", "polite");
  await expect(status(page)).toHaveAttribute("aria-atomic", "true");
  await expect(page.getByRole("log")).toHaveAttribute("aria-live", "off");
  await expect(page.getByRole("log")).toHaveAttribute("aria-busy", "false");
  await choose(page, "outage");
  await send(page, "Check current data");
  await complete(page);
  await expect(lastAnswer(page)).toContainText("AI couldn't verify this");
  await input(page).fill("Another question");
  await input(page).focus();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: "Send message" }),
  ).toBeFocused();
});

test("corrupted storage is recoverable and phone layout does not overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() =>
    sessionStorage.setItem("coinpilot-phase-2-demo", "{broken"),
  );
  await page.goto("/");
  await expect(page.getByRole("region", { name: "Your AI copilot" }).getByRole("alert")).toContainText("Saved history");
  await send(page, "Review my portfolio risk");
  await complete(page);
  await expect(lastAnswer(page)).toContainText("BTC is 45%");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  if (process.env.CAPTURE_SCREENSHOTS === "1")
    await page.screenshot({ path: "test-results/mobile.png", fullPage: true });
});

test("desktop preview and retained Phase 1 review controls", async ({
  page,
}) => {
  await page.goto("/");
  await send(page, "Review my portfolio risk");
  await complete(page);
  await expect(
    page.getByRole("button", { name: "Approve demo" }),
  ).toBeDisabled();
  await page
    .getByLabel(
      "I understand this approval is a demo and cannot execute a trade.",
    )
    .check();
  await page.getByRole("button", { name: "Approve demo" }).click();
  await expect(
    page.getByText(
      "Demo approved. No trade was placed. This review resets on refresh.",
    ),
  ).toBeVisible();
  if (process.env.CAPTURE_SCREENSHOTS === "1") {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: "test-results/desktop.png", fullPage: true });
  }
});
