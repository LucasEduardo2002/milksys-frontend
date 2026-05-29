import { expect, test, type Page } from '@playwright/test';

const username = process.env.E2E_USERNAME ?? 'testuser';
const password = process.env.E2E_PASSWORD ?? 'Teste123!';
const backendUrl = process.env.E2E_BACKEND_URL ?? 'http://localhost:3001';

const uniqueToken = () => `e2e-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

async function login(page: Page) {
  await page.context().clearCookies();
  await page.goto('/login');

  const loginSucceeded = await page.evaluate(async ({ apiUrl, currentUser, currentPassword }) => {
    const response = await fetch(`${apiUrl}/auth/login`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: currentUser,
        password: currentPassword,
      }),
    });

    return response.ok;
  }, { apiUrl: backendUrl, currentUser: username, currentPassword: password });

  expect(loginSucceeded).toBeTruthy();

  await page.goto('/pagina-inicial');
  await expect(page).toHaveURL(/\/pagina-inicial$/);
  await expect(page.getByRole('heading', { name: 'Controle de Qualidade' })).toBeVisible();
}

async function openProdutores(page: Page) {
  await page.getByRole('link', { name: 'Produtores' }).click();
  await expect(page).toHaveURL(/\/produtores$/);
  await expect(page.getByRole('heading', { name: 'Cadastro de Produtores' })).toBeVisible();
}

test.describe('Sistema completo', () => {
  test('login, dashboard, painel de recepção e logout funcionam', async ({ page }) => {
    await login(page);

    await page.getByRole('link', { name: 'Dashboard' }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByText('Total de Produtores')).toBeVisible();

    await page.getByRole('link', { name: 'Painel Recepção' }).click();
    await expect(page).toHaveURL(/\/painel-recepcao$/);
    await expect(page.getByRole('heading', { name: 'Painel de Recepção' })).toBeVisible();

    await page.getByRole('button', { name: 'Sair' }).click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();
  });

  test('cadastra, edita e exclui produtor', async ({ page }) => {
    const produtorBase = uniqueToken();
    const produtorNome = `Produtor ${produtorBase}`;
    const produtorCpf = `999${Date.now().toString().slice(-8)}`;
    const produtorTelefone = '(84) 99999-0000';
    const produtorLocalidade = 'Cidade E2E';
    const produtorEditadoTelefone = '(84) 98888-1111';
    const produtorEditadoLocalidade = 'Cidade E2E Editada';

    await login(page);
    await openProdutores(page);

    await page.getByLabel('Nome Completo').fill(produtorNome);
    await page.getByLabel('CPF/CNPJ').fill(produtorCpf);
    await page.getByLabel('Telefone').fill(produtorTelefone);
    await page.getByLabel('Localidade').fill(produtorLocalidade);
    await page.getByRole('button', { name: 'Cadastrar' }).click();

    await page.getByPlaceholder('Buscar por nome ou CPF...').fill(produtorNome);
    const row = page.getByRole('row', { name: new RegExp(produtorNome) });
    await expect(row).toBeVisible();
    await expect(row).toContainText(produtorCpf);

    await row.getByRole('button', { name: 'Editar' }).click();
    await expect(page.getByRole('heading', { name: 'Editar Produtor' })).toBeVisible();

    await page.getByLabel('Telefone').fill(produtorEditadoTelefone);
    await page.getByLabel('Localidade').fill(produtorEditadoLocalidade);
    await page.getByRole('button', { name: 'Salvar Alterações' }).click();

    await page.getByPlaceholder('Buscar por nome ou CPF...').fill(produtorNome);
    const rowAfterEdit = page.getByRole('row', { name: new RegExp(produtorNome) });
    await expect(rowAfterEdit).toBeVisible();
    await expect(rowAfterEdit).toContainText(produtorEditadoTelefone);
    await expect(rowAfterEdit).toContainText(produtorEditadoLocalidade);
    await rowAfterEdit.getByRole('button', { name: 'Apagar' }).click();

    await expect(page.getByRole('dialog', { name: 'Confirmar Exclusão' })).toBeVisible();
    await page.getByRole('button', { name: 'Excluir' }).click();

    await expect(page.getByText(produtorNome)).not.toBeVisible();
    await expect(page.getByText(produtorCpf)).not.toBeVisible();
  });
});