import { expect, test, type Page } from '@playwright/test';
async function start(page: Page) { await page.goto('/'); await page.getByRole('button', { name: '새 프로젝트' }).click(); }
async function canvasFocus(page: Page) { await page.getByRole('img', { name: '배선도 캔버스' }).focus(); }
const revision = (page: Page) => page.locator('.document-summary dl div').filter({ hasText: '리비전' }).locator('dd');

test('four objects, multi selection, group, clipboard graph and shortcuts protect text input', async ({ page }) => {
  await start(page);
  for (const type of ['line', 'point', 'text']) await page.getByRole('button', { name: `${type} 객체 추가`, exact: true }).click();
  await page.getByLabel('텍스트 내용').fill('한글 주석');
  await page.keyboard.press('Control+a'); await page.keyboard.press('Control+c');
  await expect(page.getByRole('button', { name: 'text 객체', exact: true })).toHaveCount(1);
  await page.getByRole('button', { name: '속성 적용', exact: true }).click();
  await canvasFocus(page); await page.keyboard.press('Control+a');
  await expect(page.getByText('다중 선택', { exact: true }).last()).toBeVisible();
  await page.getByRole('button', { name: '그룹', exact: true }).click();
  await canvasFocus(page); await page.keyboard.press('Control+a');
  await expect(page.getByText('그룹 선택', { exact: true }).last()).toBeVisible();
  await page.keyboard.press('Control+c'); await page.keyboard.press('Control+v');
  await expect(page.getByRole('button', { name: 'text 객체', exact: true })).toHaveCount(2);
  await page.keyboard.press('Control+z'); await expect(page.getByRole('button', { name: 'text 객체', exact: true })).toHaveCount(1);
  await page.keyboard.press('Control+y'); await expect(page.getByRole('button', { name: 'text 객체', exact: true })).toHaveCount(2);
  await page.keyboard.press('Control+a'); await page.keyboard.press('Control+x');
  await expect(page.getByRole('button', { name: 'text 객체', exact: true })).toHaveCount(0);
  await page.keyboard.press('Control+z'); await expect(page.getByRole('button', { name: 'text 객체', exact: true })).toHaveCount(2);
});

test('library registration, terminal editing, DnD and definition isolation', async ({ page }) => {
  await start(page); await page.getByRole('button', { name: '개인 부품 등록', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: '부품 편집' });
  await dialog.getByLabel('라이브러리 이름').fill('센서'); await dialog.getByRole('button', { name: 'line 추가', exact: true }).click();
  await dialog.getByRole('button', { name: '단자 추가', exact: true }).click();
  await dialog.getByLabel('단자 1 x', { exact: true }).fill('20');
  await dialog.getByRole('button', { name: '라이브러리 저장', exact: true }).click();
  await page.getByRole('button', { name: '센서 배치', exact: true }).click();
  await page.getByRole('button', { name: '센서 수정', exact: true }).click();
  await dialog.getByLabel('라이브러리 이름').fill('센서 v2'); await dialog.getByRole('button', { name: '라이브러리 저장' }).click();
  await expect(page.getByRole('button', { name: '센서 부품', exact: true })).toHaveCount(1);
  const canvas = page.getByRole('img', { name: '배선도 캔버스' });
  await page.getByRole('button', { name: '센서 v2 배치' }).dragTo(canvas, { targetPosition: { x: 180, y: 180 } });
  await expect(page.getByRole('button', { name: '센서 v2 부품', exact: true })).toHaveCount(1);
  await page.getByRole('button', { name: 'Wire', exact: true }).click();
  const component = page.getByRole('button', { name: '센서 부품', exact: true }), before = await component.getAttribute('transform');
  const t = await component.locator('[data-terminal-id]').boundingBox();
  await page.mouse.move(t!.x + t!.width / 2, t!.y + t!.height / 2); await page.mouse.down(); await page.mouse.move(t!.x + 40, t!.y + 40); await page.mouse.up();
  await expect(component).toHaveAttribute('transform', before!);
});

test('rotation drag is free, Shift snaps, Escape restores with no revision', async ({ page }) => {
  await start(page); await page.getByRole('button', { name: '부품 추가', exact: true }).click();
  const handle = page.getByRole('button', { name: '회전 핸들' }), component = page.getByRole('button', { name: '컨트롤러 부품' });
  const bounds = (await handle.boundingBox())!, x = bounds.x + bounds.width / 2, y = bounds.y + bounds.height / 2;
  await page.mouse.move(x, y); await page.mouse.down(); await page.mouse.move(x + 30, y + 10); await page.keyboard.press('Escape'); await page.mouse.up();
  await expect(component).toHaveAttribute('transform', /rotate\(0\)/); await expect(revision(page)).toHaveText('1');
  await page.mouse.move(x, y); await page.mouse.down(); await page.keyboard.down('Shift'); await page.mouse.move(x + 30, y + 10); await page.mouse.up(); await page.keyboard.up('Shift');
  await expect(component).toHaveAttribute('transform', /rotate\(45\)/); await expect(revision(page)).toHaveText('2');
  await page.getByRole('button', { name: '실행 취소', exact: true }).click(); await expect(component).toHaveAttribute('transform', /rotate\(0\)/);
});

test('image upload, actual crop/resize pixels, terminal protection, registration and undo', async ({ page }) => {
  await start(page); await page.getByLabel('부품 이미지 업로드').setInputFiles('public/fixture-image.png');
  const dialog = page.getByRole('dialog', { name: '이미지 부품 편집' });
  await expect(dialog).toBeVisible(); await dialog.getByLabel('이미지 부품 이름').fill('사진 부품');
  await dialog.getByRole('button', { name: '단자 추가', exact: true }).click();
  await dialog.getByLabel('단자 1 x', { exact: true }).fill('10'); await dialog.getByLabel('단자 1 y', { exact: true }).fill('10');
  await dialog.getByLabel('Crop x', { exact: true }).fill('20'); await dialog.getByLabel('Crop width', { exact: true }).fill('60');
  await dialog.getByRole('button', { name: 'Crop / Resize 적용', exact: true }).click(); await expect(dialog.getByRole('alert')).toContainText('단자');
  await dialog.getByLabel('Crop x', { exact: true }).fill('8'); await dialog.getByLabel('Crop width', { exact: true }).fill('72');
  await dialog.getByLabel('Resize width', { exact: true }).fill('144'); await dialog.getByLabel('Resize height', { exact: true }).fill('100');
  await dialog.getByRole('button', { name: 'Crop / Resize 적용', exact: true }).click();
  await expect(dialog.getByLabel('단자 1 x', { exact: true })).toHaveValue('10');
  await expect(dialog.getByLabel('단자 1 y', { exact: true })).toHaveValue('20');
  const source = await dialog.locator('svg image').getAttribute('href');
  const pixels = await page.evaluate(async source => { const img = new Image(); img.src = source!; await img.decode(); const canvas = document.createElement('canvas'); canvas.width = img.width; canvas.height = img.height; const ctx = canvas.getContext('2d')!; ctx.drawImage(img, 0, 0); return { width: img.width, height: img.height, pixel: [...ctx.getImageData(20, 20, 1, 1).data] }; }, source);
  expect(pixels.width).toBe(144); expect(pixels.height).toBe(100); expect(pixels.pixel).toEqual([30, 130, 95, 255]);
  await expect(dialog.getByRole('button', { name: /배경 제거/ })).toBeDisabled();
  await page.screenshot({ path: 'test-results/fe03-image-editor.png' });
  await dialog.getByRole('button', { name: '이미지 부품 등록', exact: true }).click();
  const canvas = page.getByRole('img', { name: '배선도 캔버스' }), bounds = (await canvas.boundingBox())!;
  await page.mouse.move(bounds.x + 200, bounds.y + 150); await page.keyboard.down('Control'); await page.mouse.wheel(0, -100); await page.keyboard.up('Control'); await page.mouse.wheel(0, 35);
  const expected = await page.locator('[data-testid="document-layer"]').evaluate((el, point) => { const p = new DOMPoint(point.x, point.y).matrixTransform((el as SVGGraphicsElement).getScreenCTM()!.inverse()); return { x: p.x, y: p.y }; }, { x: bounds.x + 200, y: bounds.y + 150 });
  await page.getByRole('button', { name: '사진 부품 배치', exact: true }).dragTo(canvas, { targetPosition: { x: 200, y: 150 } });
  const transform = await page.getByRole('button', { name: '사진 부품 부품', exact: true }).getAttribute('transform');
  const coordinates = transform!.match(/translate\(([^ ]+) ([^)]+)/)!;
  expect(Number(coordinates[1])).toBeCloseTo(expected.x, 1); expect(Number(coordinates[2])).toBeCloseTo(expected.y, 1);

  await expect(page.getByRole('button', { name: '사진 부품 부품', exact: true }).locator('image')).toHaveAttribute('href', source!);
  await page.getByRole('button', { name: '실행 취소', exact: true }).click(); await expect(page.getByRole('button', { name: '사진 부품 부품', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: '다시 실행', exact: true }).click(); await expect(page.getByRole('button', { name: '사진 부품 부품', exact: true })).toHaveCount(1);
});

test('image paste starts draft, cancel and decode failure never mutate document', async ({ page }) => {
  await start(page);
  await page.evaluate(async () => { const response = await fetch('/fixture-image.png'); const blob = await response.blob(); const data = new DataTransfer(); data.items.add(new File([blob], 'pasted.png', { type: 'image/png' })); document.querySelector('svg.drawing-canvas')!.dispatchEvent(new ClipboardEvent('paste', { clipboardData: data, bubbles: true })); });
  const dialog = page.getByRole('dialog', { name: '이미지 부품 편집' }); await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: '취소', exact: true }).click(); await expect(revision(page)).toHaveText('0');
  await page.getByLabel('부품 이미지 업로드').setInputFiles({ name: 'broken.png', mimeType: 'image/png', buffer: Buffer.from('broken') });
  await expect(page.getByRole('alert').filter({ hasText: '디코딩' })).toBeVisible(); await expect(revision(page)).toHaveText('0');
});

test('Ctrl/Shift toggle, ordinary click selects one, multi move and free rotation', async ({ page }) => {
  await start(page);
  await page.getByRole('button', { name: '부품 추가', exact: true }).click(); await page.getByRole('button', { name: '부품 추가', exact: true }).click();
  const parts = page.getByRole('button', { name: '컨트롤러 부품' });
  await parts.nth(0).click(); await parts.nth(1).click({ modifiers: ['Control'] });
  await expect(page.getByText('다중 선택', { exact: true }).last()).toBeVisible();
  await parts.nth(1).click({ modifiers: ['Shift'] }); await expect(page.getByLabel('부품 x', { exact: true })).toHaveValue('20');
  await parts.nth(1).click({ modifiers: ['Shift'] });
  const before = await parts.nth(1).getAttribute('transform'), box = (await parts.nth(0).boundingBox())!;
  await page.mouse.move(box.x + 10, box.y + 10); await page.mouse.down(); await page.mouse.move(box.x + 30, box.y + 30); await page.mouse.up();
  await expect(parts.nth(1)).not.toHaveAttribute('transform', before!);
  await parts.nth(0).click(); await expect(page.getByLabel('부품 x', { exact: true })).toBeVisible();
  const h = (await page.getByRole('button', { name: '회전 핸들' }).boundingBox())!;
  await page.mouse.move(h.x + h.width / 2, h.y + h.height / 2); await page.mouse.down(); await page.mouse.move(h.x + 19, h.y + 7); await page.mouse.up();
  const value = Number((await parts.nth(0).getAttribute('transform'))!.match(/rotate\(([^)]+)/)![1]);
  expect(value).not.toBe(0); expect(value % 45).not.toBe(0);
  await page.screenshot({ path: 'test-results/fe03-objects.png' });
});

test('library image edits preserve placed instances, standalone Image works, instance editing is one undo', async ({ page }) => {
  await start(page); await page.getByLabel('부품 이미지 업로드').setInputFiles('public/fixture-image.png');
  const dialog = page.getByRole('dialog', { name: '이미지 부품 편집' });
  await dialog.getByLabel('이미지 부품 이름').fill('사진'); await dialog.getByRole('button', { name: '이미지 부품 등록', exact: true }).click();
  await page.getByRole('button', { name: '사진 배치', exact: true }).click();
  const component = page.getByRole('button', { name: '사진 부품', exact: true }); const original = await component.locator('image').getAttribute('href');
  await page.getByRole('button', { name: '사진 이미지 수정', exact: true }).click();
  await dialog.getByLabel('Resize width', { exact: true }).fill('40'); await dialog.getByRole('button', { name: 'Crop / Resize 적용', exact: true }).click();
  await expect(dialog.locator('svg image')).not.toHaveAttribute('href', original!);
  await dialog.getByRole('button', { name: '이미지 부품 등록', exact: true }).click();
  await expect(component.locator('image')).toHaveAttribute('href', original!);
  await page.getByRole('button', { name: '이미지 객체 추가 · 사진', exact: true }).click(); await expect(page.getByRole('button', { name: 'image 객체', exact: true })).toBeVisible();
  await component.click(); await page.getByRole('button', { name: 'Image', exact: true }).click(); await page.getByRole('button', { name: 'Crop / Resize', exact: true }).click();
  await dialog.getByLabel('Resize width', { exact: true }).fill('20'); await dialog.getByRole('button', { name: 'Crop / Resize 적용', exact: true }).click();
  await expect(dialog.locator('svg image')).not.toHaveAttribute('href', original!);
  await dialog.getByRole('button', { name: '이미지 변경 저장', exact: true }).click(); await expect(component.locator('image')).not.toHaveAttribute('href', original!);
  await page.getByRole('button', { name: '실행 취소', exact: true }).click(); await expect(component.locator('image')).toHaveAttribute('href', original!);
});

test('pending image read cannot insert into a replacement project', async ({ page }) => {
  await page.addInitScript(() => {
    const read = FileReader.prototype.readAsDataURL;
    FileReader.prototype.readAsDataURL = function(blob) { window.setTimeout(() => read.call(this, blob), 400); };
  });
  await start(page); await page.getByLabel('부품 이미지 업로드').setInputFiles('public/fixture-image.png');
  await page.getByRole('button', { name: '프로젝트 닫기' }).click(); await page.getByRole('button', { name: '새 프로젝트' }).click();
  await page.waitForTimeout(600);
  await expect(page.getByRole('dialog', { name: '이미지 부품 편집' })).toHaveCount(0); await expect(revision(page)).toHaveText('0');
  await expect(page.getByRole('button', { name: 'fixture-image.png 배치', exact: true })).toHaveCount(0);
});
