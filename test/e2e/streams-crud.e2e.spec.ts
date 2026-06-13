import { expect, test } from "@playwright/test";

import { resetFirestore, seedFirestoreCatalog } from "./support/emulator.ts";

test("operator can create, edit, and delete a stream through the full local stack", async ({ page }) => {
  await resetFirestore();
  await seedFirestoreCatalog();

  const uniqueTitle = `Late Signals ${Date.now()}`;
  const updatedTitle = `${uniqueTitle} Remix`;

  await page.goto("/streams");
  await expect(page.getByRole("heading", { name: "Streams" })).toBeVisible();
  await expect(page.getByText("Morning News")).toBeVisible();

  await page.getByRole("button", { name: /\+ Create Stream/i }).click();
  await expect(page.getByText("Create Draft Stream")).toBeVisible();

  await page.getByLabel("Title").fill(uniqueTitle);
  await page.getByLabel("Stream URL").fill("https://radio.example.com/late-signals.m3u8");
  await page.getByLabel("Image URL").fill("https://cdn.example.com/streams/late-signals.jpg");
  await page.getByLabel("Summary").fill("After-hours interviews and listener call-ins.");
  await page.locator("form.stream-form").getByRole("button", { name: "Create Stream" }).click();

  await expect(page.getByRole("status")).toContainText("Draft stream created as");
  await expect(page.getByRole("button", { name: `Open actions for ${uniqueTitle}` })).toBeVisible();

  await page.getByLabel("Search streams").fill(uniqueTitle);
  await page.getByRole("button", { name: `Open actions for ${uniqueTitle}` }).click();
  await page.getByRole("button", { name: "Edit" }).click();

  await expect(page.getByText("Edit Stream")).toBeVisible();
  await page.getByLabel("Title").fill(updatedTitle);
  await page.locator("form.stream-form").getByRole("button", { name: "Save Changes" }).click();

  await expect(page.getByRole("status")).toContainText("was updated");
  await expect(page.getByText(updatedTitle)).toBeVisible();

  page.once("dialog", (dialog) => dialog.accept());
  await page.getByLabel("Search streams").fill(updatedTitle);
  await page.getByRole("button", { name: `Open actions for ${updatedTitle}` }).click();
  await page.getByRole("button", { name: "Delete" }).click();

  await expect(page.getByRole("status")).toContainText("was deleted");
  await expect(page.getByText("No streams match the current view.")).toBeVisible();
});
