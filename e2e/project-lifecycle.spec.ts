import { expect, test } from "@playwright/test";

test("creates a project and adds a component without crypto.randomUUID", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.addInitScript(() => {
    Object.defineProperty(window.crypto, "randomUUID", { value: undefined });
  });

  await page.goto("/");
  await page.getByRole("button", { name: "새 프로젝트" }).click();
  await expect(page.getByRole("img", { name: "배선도 캔버스" })).toBeVisible();
  await page.getByRole("button", { name: "부품 추가" }).click();
  await expect(page.getByRole("button", { name: "컨트롤러 부품" })).toBeVisible();
  expect(pageErrors).toEqual([]);
});

test("shows an error if project creation fails", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window.crypto, "randomUUID", {
      value: () => { throw new Error("ID generation unavailable"); },
    });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "새 프로젝트" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "새 프로젝트를 만들 수 없습니다." })).toBeVisible();
});

test("creates and closes an empty project", async ({ page }) => {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  await page.goto("/");

  await page.getByRole("button", { name: "새 프로젝트" }).click();
  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
  await expect(page.getByRole("img", { name: "배선도 캔버스" })).toBeVisible();
  await expect(page.getByText("제목 없는 프로젝트", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "프로젝트 닫기" }).click();
  await expect(page.getByRole("button", { name: "새 프로젝트" })).toBeVisible();
});

test("opens a versioned project file", async ({ page }) => {
  await page.goto("/");

  await page.locator('input[type="file"]').setInputFiles("public/sample-project.wireproj");

  await expect(page.getByText("샘플 빈 프로젝트", { exact: true })).toBeVisible();
  await expect(page.getByRole("img", { name: "배선도 캔버스" })).toBeVisible();
  await expect(page.getByText("v2", { exact: true })).toBeVisible();
});

test("adds and deletes a component on the canvas", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "새 프로젝트" }).click();
  await page.getByRole("button", { name: "부품 추가" }).click();
  await expect(page.getByRole("button", { name: "컨트롤러 부품" })).toBeVisible();
  await page.getByRole("button", { name: "선택한 부품 삭제" }).click();
  await expect(page.getByRole("button", { name: "컨트롤러 부품" })).toHaveCount(0);
});


test("limits pages and keeps editing and undo scoped to active page", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "새 프로젝트" }).click();
  await page.getByRole("button", { name: "시트 추가" }).click();
  await page.getByRole("button", { name: "EZ-002", exact: true }).click();
  await page.getByRole("button", { name: "부품 추가", exact: true }).click();
  await page.getByRole("button", { name: "EZ-001", exact: true }).click();
  await expect(page.getByRole("button", { name: "컨트롤러 부품" })).toHaveCount(0);
  await page.getByRole("button", { name: "EZ-002", exact: true }).click();
  await expect(page.getByRole("button", { name: "컨트롤러 부품" })).toHaveCount(1);
  await page.getByRole("button", { name: "실행 취소", exact: true }).click();
  await expect(page.getByRole("button", { name: "컨트롤러 부품" })).toHaveCount(0);
  await page.getByRole("button", { name: "다시 실행", exact: true }).click();
  await expect(page.getByRole("button", { name: "컨트롤러 부품" })).toHaveCount(1);
  await page.getByRole("button", { name: "시트 추가" }).click();
  await expect(page.getByRole("button", { name: "시트 추가" })).toBeDisabled();
});

test("reports unsupported file version and remains usable", async ({ page }) => {
  await page.goto("/");
  await page.locator('input[type="file"]').setInputFiles({ name: "unsupported.wireproj", mimeType: "application/json", buffer: Buffer.from(JSON.stringify({ format: "ezwire-project", version: 999 })) });
  await expect(page.getByRole("alert").filter({ hasText: "지원하지 않는 파일 버전" })).toBeVisible();
  await page.getByRole("button", { name: "새 프로젝트" }).click();
  await expect(page.getByRole("img", { name: "배선도 캔버스" })).toBeVisible();
});


test("drag commits once, undo restores, and Escape cancels preview", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "새 프로젝트" }).click();
  await page.getByRole("button", { name: "부품 추가", exact: true }).click();
  const component = page.getByRole("button", { name: "컨트롤러 부품" });
  const revision = page.locator(".document-summary dl div").filter({ hasText: "리비전" }).locator("dd");
  const original = await component.getAttribute("transform");
  const bounds = (await component.boundingBox())!;
  await page.mouse.move(bounds.x + 10, bounds.y + 10);
  await page.mouse.down();
  await page.mouse.move(bounds.x + 50, bounds.y + 35, { steps: 5 });
  await expect(revision).toHaveText("1");
  await page.mouse.up();
  await expect(revision).toHaveText("2");
  await page.getByRole("button", { name: "실행 취소", exact: true }).click();
  await expect(component).toHaveAttribute("transform", original!);
  await expect(revision).toHaveText("3");
  await page.mouse.move(bounds.x + 10, bounds.y + 10);
  await page.mouse.down();
  await page.mouse.move(bounds.x + 60, bounds.y + 40, { steps: 3 });
  await page.keyboard.press("Escape");
  await page.mouse.up();
  await expect(component).toHaveAttribute("transform", original!);
  await expect(revision).toHaveText("3");
});
