import { expect, test, type Page } from "@playwright/test";

async function start(page: Page) {
  await page.goto("/"); await page.getByRole("button", { name: "새 프로젝트" }).click();
}
async function geometry(page: Page) {
  return page.getByTestId("document-layer").evaluate(node => {
    const m = (node as unknown as SVGGElement).getScreenCTM()!;
    return { a: m.a, d: m.d, e: m.e, f: m.f };
  });
}
async function dragAt(page: Page, x: number, y: number, dx: number, dy: number) {
  await page.mouse.move(x, y); await page.mouse.down(); await page.mouse.move(x + dx, y + dy, { steps: 4 }); await page.mouse.up();
}

test("fixed toolbox, tabs, panels, paper and summary", async ({ page }) => {
  await start(page);
  const box = await page.getByRole("toolbar").boundingBox();
  for (const mode of ["Wire", "Image", "Mouse"]) {
    await page.getByRole("button", { name: mode, exact: true }).click();
    await expect(page.getByRole("button", { name: mode, exact: true })).toHaveAttribute("aria-pressed", "true");
    expect((await page.getByRole("toolbar").boundingBox())?.x).toBe(box?.x);
  }
  await page.getByRole("tab", { name: "공용부품", exact: true }).click();
  await expect(page.getByRole("tabpanel")).toContainText("공용 서비스 미연동");
  await page.getByRole("tab", { name: "라이브러리", exact: true }).click();
  await page.getByRole("button", { name: "부품 추가", exact: true }).click();
  const original = await page.getByRole("button", { name: "컨트롤러 부품" }).getAttribute("transform");
  for (const [paper, width, height] of [["A4-landscape", "297", "210"], ["A4-portrait", "210", "297"], ["A3-landscape", "420", "297"], ["A3-portrait", "297", "420"]]) {
    await page.getByLabel("용지", { exact: true }).selectOption(paper);
    await expect(page.getByTestId("paper")).toHaveAttribute("width", width); await expect(page.getByTestId("paper")).toHaveAttribute("height", height);
    await expect(page.getByRole("button", { name: "컨트롤러 부품" })).toHaveAttribute("transform", original!);
  }
  await expect(page.getByTestId("paper")).toHaveAttribute("fill", "#ffffff");
  await page.getByRole("button", { name: "컨트롤러 부품" }).click();
  expect(await page.locator(".selection-summary").evaluate(el => getComputedStyle(el).whiteSpace)).toBe("nowrap");
  await page.screenshot({ path: "test-results/workspace-expanded.png" });
  const before = await page.getByTestId("canvas-frame").boundingBox();
  await page.getByRole("button", { name: "좌측 Sidebar 접기" }).click(); await page.getByRole("button", { name: "우측 Sidebar 접기" }).click();
  expect((await page.getByTestId("canvas-frame").boundingBox())!.width).toBeGreaterThan(before!.width + 300);
  await page.screenshot({ path: "test-results/workspace-collapsed.png" });
});

test("wheel modifiers, both pans, protected dialog, stable document scale on resize", async ({ page }) => {
  await start(page);
  const svg = page.getByRole("img", { name: "배선도 캔버스" });
  await svg.hover(); const a = await geometry(page);
  await page.mouse.wheel(0, 40); await expect.poll(async () => (await geometry(page)).f).toBeCloseTo(a.f - 40);
  await page.keyboard.down("Shift"); await page.mouse.wheel(0, 30); await page.keyboard.up("Shift");
  await expect.poll(async () => (await geometry(page)).e).toBeCloseTo(a.e - 30);
  const bounds = (await svg.boundingBox())!, anchor = { x: bounds.x + 200, y: bounds.y + 150 };
  await page.mouse.move(anchor.x, anchor.y);
  for (const modifier of ["Control", "Alt"]) {
    const before = await geometry(page);
    await page.keyboard.down(modifier); await page.keyboard.down("Shift"); await page.mouse.wheel(0, -80); await page.keyboard.up("Shift"); await page.keyboard.up(modifier);
    await expect.poll(async () => (await geometry(page)).a).toBeGreaterThan(before.a);
    const after = await geometry(page);
    expect((anchor.x - after.e) / after.a).toBeCloseTo((anchor.x - before.e) / before.a, 4);
    expect((anchor.y - after.f) / after.d).toBeCloseTo((anchor.y - before.f) / before.d, 4);
  }
  for (const middle of [true, false]) {
    const before = await geometry(page); await svg.focus(); await page.mouse.move(anchor.x, anchor.y);
    if (!middle) await page.keyboard.down("Space");
    await page.mouse.down({ button: middle ? "middle" : "left" }); await page.mouse.move(anchor.x + 40, anchor.y + 25, { steps: 4 }); await page.mouse.up({ button: middle ? "middle" : "left" });
    if (!middle) await page.keyboard.up("Space");
    const after = await geometry(page); expect(after.e - before.e).toBeCloseTo(40); expect(after.f - before.f).toBeCloseTo(25);
  }
  const stable = await geometry(page);
  await page.getByRole("button", { name: "System", exact: true }).click();
  const dialog = page.getByRole("dialog"); await dialog.hover(); await page.mouse.wheel(0, 100); await page.getByLabel("Canvas 배경색").focus(); await page.keyboard.press("Space"); await page.keyboard.press("Escape");
  expect(await geometry(page)).toEqual(stable);
  // Native color picker Escape may consume the first key; close the dialog explicitly.
  if (await dialog.isVisible()) await dialog.getByRole("button", { name: "닫기", exact: true }).click();
  await page.setViewportSize({ width: 1100, height: 800 }); expect((await geometry(page)).a).toBe(stable.a);
});

test("drag and DnD hit tests match CTM after panel resize, zoom and pan; snap preview commits", async ({ page }) => {
  await start(page); await page.getByLabel("Snap", { exact: true }).selectOption("off");
  await page.getByRole("button", { name: "부품 추가", exact: true }).click();
  const component = page.getByRole("button", { name: "컨트롤러 부품" });
  await page.getByRole("button", { name: "좌측 Sidebar 접기" }).click();
  await page.getByRole("button", { name: "우측 Sidebar 접기" }).click();
  const initial = await geometry(page);
  await page.mouse.move(initial.e + 30 * initial.a, initial.f + 30 * initial.a);
  await page.keyboard.down("Control"); await page.mouse.wheel(0, -80); await page.keyboard.up("Control");
  await expect.poll(async () => (await geometry(page)).a).toBeGreaterThan(initial.a);
  const svg = page.getByRole("img", { name: "배선도 캔버스" });
  const zoomed = await geometry(page); await page.mouse.wheel(0, -20);
  await expect.poll(async () => (await geometry(page)).f).toBeCloseTo(zoomed.f + 20);
  const m = await geometry(page);
  await dragAt(page, m.e + 25 * m.a, m.f + 25 * m.a, 20 * m.a, 10 * m.a);
  const moved = (await component.getAttribute("transform"))!.match(/translate\(([^ ]+) ([^)]+)\)/)!;
  expect(Number(moved[1])).toBeCloseTo(40); expect(Number(moved[2])).toBeCloseTo(30);
  await page.getByLabel("Snap", { exact: true }).selectOption("grid");
  const n = await geometry(page); await page.mouse.move(n.e + 45 * n.a, n.f + 35 * n.a); await page.mouse.down(); await page.mouse.move(n.e + 52 * n.a, n.f + 43 * n.a);
  await expect(page.getByTestId("snap-preview")).toHaveAttribute("transform", "translate(45 40)"); await page.mouse.up();
  await expect(component).toHaveAttribute("transform", "translate(45 40) rotate(0) scale(1)");
  await page.getByRole("button", { name: "좌측 Sidebar 펼치기" }).click();
  const target = await geometry(page);
  const transfer = await page.evaluateHandle(() => new DataTransfer());
  await page.getByRole("button", { name: "부품 추가", exact: true }).dispatchEvent("dragstart", { dataTransfer: transfer });
  await svg.dispatchEvent("drop", { dataTransfer: transfer, clientX: target.e + 101 * target.a, clientY: target.f + 102 * target.a });
  await expect(component).toHaveCount(2); await expect(component.nth(1)).toHaveAttribute("transform", "translate(100 100) rotate(0) scale(1)");
  await page.getByLabel("Snap", { exact: true }).selectOption("object");
  const p = await geometry(page); await page.mouse.move(p.e + 101 * p.a, p.f + 101 * p.a);
  await expect(page.getByTestId("snap-preview")).toHaveAttribute("transform", "translate(100 100)");
  await page.mouse.move(p.e + 105 * p.a, p.f + 105 * p.a); await page.mouse.down();
  await page.mouse.move(p.e + 52 * p.a, p.f + 47 * p.a, { steps: 4 });
  await expect(page.getByTestId("snap-preview")).toHaveAttribute("transform", "translate(45 40)");
  await page.mouse.up(); await expect(component.nth(1)).toHaveAttribute("transform", "translate(45 40) rotate(0) scale(1)");
  await page.getByLabel("Snap", { exact: true }).selectOption("off"); await page.mouse.move(p.e + 101 * p.a, p.f + 101 * p.a); await expect(page.getByTestId("snap-preview")).toHaveCount(0);
});

test("page and mode changes discard gestures and selection", async ({ page }) => {
  await start(page); await page.getByRole("button", { name: "부품 추가", exact: true }).click();
  await page.getByRole("button", { name: "시트 추가" }).click();
  const component = page.getByRole("button", { name: "컨트롤러 부품" });
  const original = await component.getAttribute("transform"); const m = await geometry(page);
  await page.mouse.move(m.e + 25 * m.a, m.f + 25 * m.a); await page.mouse.down(); await page.mouse.move(m.e + 35 * m.a, m.f + 35 * m.a);
  await page.getByRole("button", { name: "EZ-002", exact: true }).dispatchEvent("click"); await page.mouse.up();
  await expect(component).toHaveCount(0); await expect(page.locator(".selection-summary")).toHaveText("선택 없음");
  await page.getByRole("button", { name: "EZ-001", exact: true }).click(); await expect(component).toHaveAttribute("transform", original!);
  await page.mouse.move(m.e + 25 * m.a, m.f + 25 * m.a); await page.mouse.down(); await page.mouse.move(m.e + 35 * m.a, m.f + 35 * m.a);
  await page.getByRole("button", { name: "Wire", exact: true }).dispatchEvent("click"); await page.mouse.up(); await expect(component).toHaveAttribute("transform", original!);
});

test("System background is a reversible document edit and fullscreen has a working entry", async ({ page }) => {
  await start(page);
  await page.getByRole("button", { name: "System", exact: true }).click();
  await page.getByLabel("Canvas 배경색").fill("#aabbcc");
  await expect(page.getByTestId("paper")).toHaveAttribute("fill", "#aabbcc");
  await page.getByRole("dialog").getByRole("button", { name: "닫기", exact: true }).click();
  await page.getByRole("button", { name: "실행 취소", exact: true }).click();
  await expect(page.getByTestId("paper")).toHaveAttribute("fill", "#ffffff");
  await page.getByRole("button", { name: "Full Screen", exact: true }).click();
  await expect.poll(() => page.evaluate(() => !!document.fullscreenElement)).toBe(true);
  await page.getByRole("button", { name: "Full Screen", exact: true }).click();
  await expect.poll(() => page.evaluate(() => !!document.fullscreenElement)).toBe(false);
  await page.setViewportSize({ width: 1024, height: 768 });
  await expect(page.getByRole("button", { name: "System", exact: true })).toBeInViewport();
  await page.getByRole("button", { name: "Wire", exact: true }).click();
  await page.screenshot({ path: "test-results/workspace-1024-wire.png" });
});
