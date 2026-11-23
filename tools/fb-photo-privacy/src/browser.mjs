// Abre um Chromium VISÍVEL com perfil local. Você faz o login à mão; o script nunca
// lê senha, cookies ou tokens — ele só usa a aba já autenticada.
import readline from 'node:readline/promises';
import { chromium } from 'playwright';
import { PATHS, FB, PACE, LOGGED_OUT_RX } from './config.mjs';
import { assertNotBlocked, sleep, PlatformBlockError } from './safety.mjs';

export async function openBrowser() {
  const context = await chromium.launchPersistentContext(PATHS.profileDir, {
    headless: false,
    viewport: { width: 1280, height: 900 },
    locale: 'pt-BR',
  });
  const page = context.pages()[0] || (await context.newPage());
  page.setDefaultTimeout(15000);
  return { context, page };
}

export async function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question(question);
  rl.close();
  return answer.trim();
}

export async function goto(page, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await sleep(PACE.settleMs);
  await assertNotBlocked(page);
}

async function looksLoggedOut(page) {
  if (await page.locator('input[name="pass"], input[type="password"]').count()) return true;
  const txt = await page.locator('body').innerText().catch(() => '');
  return LOGGED_OUT_RX.test(txt.slice(0, 3000)) && !(await page.locator('[role="navigation"]').count());
}

/** Abre o Facebook e espera VOCÊ confirmar no terminal que está logado. */
export async function ensureLoggedIn(page, { interactive = true } = {}) {
  await page.goto(FB.home, { waitUntil: 'domcontentloaded' });
  await sleep(PACE.settleMs);
  if (!(await looksLoggedOut(page))) return true;
  if (!interactive) throw new PlatformBlockError('Sessão não está logada. Rode "npm run login" primeiro.');
  console.log('\n➡  Faça o login no Facebook na janela do navegador que abriu.');
  console.log('   (O script NÃO vê nem guarda sua senha. Resolva qualquer verificação você mesmo.)');
  for (;;) {
    await ask('   Quando estiver logado e vendo o seu feed, pressione ENTER aqui… ');
    await sleep(1000);
    if (!(await looksLoggedOut(page))) return true;
    console.log('   Ainda parece deslogado. Termine o login e pressione ENTER de novo.');
  }
}
