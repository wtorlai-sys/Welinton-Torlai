// Barreiras de segurança: todo clique passa por safeClick, e todo passo checa bloqueios.
import fs from 'node:fs';
import path from 'node:path';
import { DANGER_RX, BLOCK_URL_RX, BLOCK_TEXT_RX, PATHS, PACE } from './config.mjs';

export class SafetyError extends Error {
  constructor(msg) { super(msg); this.name = 'SafetyError'; }
}
// Bloqueio/verificação do Facebook: interrompe a execução INTEIRA.
export class PlatformBlockError extends Error {
  constructor(msg) { super(msg); this.name = 'PlatformBlockError'; }
}

async function describe(locator) {
  return locator.evaluate((el) => {
    const clean = (t) => (t || '').replace(/\s+/g, ' ').trim().slice(0, 300);
    return { aria: clean(el.getAttribute('aria-label')), text: clean(el.innerText || el.textContent) };
  });
}

/**
 * Clica apenas se o elemento NÃO tiver texto perigoso (excluir, arquivar, desmarcar...).
 * `expect` (regex) exige que o texto do elemento corresponda ao que queremos clicar.
 */
export async function safeClick(locator, { expect, what = 'elemento' } = {}) {
  await locator.waitFor({ state: 'visible', timeout: 8000 });
  const { aria, text } = await describe(locator);
  const shown = [aria, text].filter(Boolean).join(' | ');
  if (DANGER_RX.test(aria) || DANGER_RX.test(text)) {
    throw new SafetyError(`Clique BLOQUEADO em ${what}: texto perigoso "${shown}"`);
  }
  if (expect && !expect.test(aria) && !expect.test(text)) {
    throw new SafetyError(`Clique recusado em ${what}: texto "${shown}" não corresponde ao esperado ${expect}`);
  }
  await locator.scrollIntoViewIfNeeded().catch(() => {});
  await locator.click();
  return shown;
}

/** Lança PlatformBlockError se houver checkpoint, CAPTCHA, bloqueio temporário ou logout. */
export async function assertNotBlocked(page) {
  const url = page.url();
  if (BLOCK_URL_RX.test(url)) {
    throw new PlatformBlockError(`O Facebook pediu verificação ou encerrou a sessão (URL: ${url.split('?')[0]}). Parando sem tentar contornar.`);
  }
  const dialogText = await page
    .locator('[role="dialog"], [role="alertdialog"]')
    .evaluateAll((els) => els.map((e) => e.innerText || '').join('\n'))
    .catch(() => '');
  const title = await page.title().catch(() => '');
  const m = (dialogText + '\n' + title).match(BLOCK_TEXT_RX);
  if (m) {
    throw new PlatformBlockError(`O Facebook exibiu um aviso de limite/segurança ("${m[0]}"). Parando sem tentar contornar.`);
  }
}

export function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export function humanDelay() {
  const ms = PACE.minDelayMs + Math.floor(Math.random() * (PACE.maxDelayMs - PACE.minDelayMs));
  return sleep(ms);
}

export async function screenshot(page, name) {
  try {
    fs.mkdirSync(PATHS.screenshots, { recursive: true });
    const file = path.join(PATHS.screenshots, `${name.replace(/[^\w.-]+/g, '_')}.png`);
    await page.screenshot({ path: file });
    return file;
  } catch {
    return null;
  }
}
