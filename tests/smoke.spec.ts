import { expect, test } from "@playwright/test";

const pages: [string, RegExp][] = [
  ["/", /ADRITASH/],
  ["/about", /About \| ADRITASH/],
  ["/insights", /Insights \| ADRITASH/],
  ["/insights/cloud-migration-what-fails", /Cloud Migration/],
  ["/dashboards", /Dashboards \| ADRITASH/],
  ["/dashboards/project-management", /PM Toolkit \| ADRITASH/],
  ["/dashboards/project-management/raid-generator", /ADRITASH/],
  ["/dashboards/presentation", /Presentation Dashboard \| ADRITASH/],
];

for (const [path, title] of pages) {
  test(`${path} loads with the right title`, async ({ page }) => {
    const res = await page.goto(path);
    expect(res?.status()).toBe(200);
    await expect(page).toHaveTitle(title);
  });
}

test("PM dashboard labels its data as sample data", async ({ page }) => {
  await page.goto("/dashboards/project-management");
  await expect(page.getByRole("note")).toContainText("Illustrative sample data");
});

test("unknown article returns 404", async ({ page }) => {
  const res = await page.goto("/insights/does-not-exist");
  expect(res?.status()).toBe(404);
});

test("RSS feed lists articles", async ({ request }) => {
  const res = await request.get("/insights/rss.xml");
  expect(res.status()).toBe(200);
  expect(await res.text()).toContain("<item>");
});
