import { expect, test } from "@playwright/test";

test("Pulse product page loads", async ({ page }) => {
  const res = await page.goto("/pulse");
  expect(res?.status()).toBe(200);
  await expect(page).toHaveTitle(/Pulse \| ADRITASH/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("WhatsApp");
});

test("Pulse privacy and terms load", async ({ page }) => {
  for (const path of ["/pulse/privacy", "/pulse/terms"]) {
    expect((await page.goto(path))?.status()).toBe(200);
    await expect(page.getByRole("note")).toContainText("Draft pending legal review");
  }
});

test("health endpoint reveals nothing sensitive", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.status()).toBe(200);
  expect(await res.json()).toEqual({ status: "ok" });
});

test("admin is never publicly readable", async ({ page }) => {
  await page.goto("/admin");
  await expect(page.getByText("Total users")).toHaveCount(0);
});

test("webhook rejects unsigned posts", async ({ request }) => {
  const res = await request.post("/api/pulse/whatsapp/webhook", { data: { object: "whatsapp_business_account", entry: [] } });
  expect([401, 404]).toContain(res.status());
});
