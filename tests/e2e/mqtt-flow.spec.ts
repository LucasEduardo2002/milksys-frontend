import { expect, test, type Page } from '@playwright/test';
import mqtt, { type MqttClient } from 'mqtt';

const username = process.env.E2E_USERNAME ?? 'milk-admin';
const password = process.env.E2E_PASSWORD ?? 'milk123#';
const backendUrl = process.env.E2E_BACKEND_URL ?? 'http://localhost:3001';
const mqttUrl = process.env.E2E_MQTT_WS_URL ?? 'ws://localhost:8082';

const uniqueToken = () => `mqtt-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

type ApiResult<T> = {
  ok: boolean;
  status: number;
  payload: T;
};

async function apiFetch<T>(page: Page, path: string, options: {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  timeoutMs?: number;
} = {}): Promise<ApiResult<T>> {
  return page.evaluate(async ({ apiBase, requestPath, requestOptions }) => {
    const headers = new Headers(requestOptions.headers ?? {});
    const controller = new AbortController();
    let body: BodyInit | undefined;
    const timeoutId = window.setTimeout(() => controller.abort(), requestOptions.timeoutMs ?? 10000);

    if (requestOptions.body !== undefined) {
      if (typeof requestOptions.body === 'string') {
        body = requestOptions.body;
      } else {
        headers.set('Content-Type', 'application/json');
        body = JSON.stringify(requestOptions.body);
      }
    }

    const response = await fetch(`${apiBase}${requestPath}`, {
      method: requestOptions.method ?? 'GET',
      credentials: 'include',
      headers,
      body,
      signal: controller.signal,
    });

    window.clearTimeout(timeoutId);

    const raw = await response.text();
    const payload = raw ? JSON.parse(raw) : null;

    return {
      ok: response.ok,
      status: response.status,
      payload,
    };
  }, {
    apiBase: backendUrl,
    requestPath: path,
    requestOptions: options,
  }) as Promise<ApiResult<T>>;
}

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

function connectMqttClient(): Promise<MqttClient> {
  return new Promise((resolve, reject) => {
    const client = mqtt.connect(mqttUrl, {
      reconnectPeriod: 0,
      connectTimeout: 5000,
      clientId: `e2e-${uniqueToken()}`,
    });

    const onError = (error: Error) => {
      client.end(true);
      reject(error);
    };

    client.once('connect', () => {
      client.off('error', onError);
      resolve(client);
    });

    client.once('error', onError);
  });
}

function readRetainedMessage(topic: string, timeoutMs = 3000): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const client = mqtt.connect(mqttUrl, {
      reconnectPeriod: 0,
      connectTimeout: 5000,
      clientId: `retained-${uniqueToken()}`,
    });

    const timer = setTimeout(() => {
      client.end(true);
      resolve(null);
    }, timeoutMs);

    client.once('error', error => {
      clearTimeout(timer);
      client.end(true);
      reject(error);
    });

    client.once('connect', () => {
      client.subscribe(topic, { qos: 0 }, error => {
        if (error) {
          clearTimeout(timer);
          client.end(true);
          reject(error);
          return;
        }
      });
    });

    client.once('message', (_receivedTopic, message) => {
      clearTimeout(timer);
      client.end(true);
      resolve(message.toString());
    });
  });
}

test.describe('Fluxo MQTT', () => {
  test('publica a fila e processa o peso até limpar o tópico', async ({ page }) => {
    const producerName = `Produtor MQTT ${uniqueToken()}`;
    const producerCpf = `998${Date.now().toString().slice(-8)}`;
    const queueDate = new Date().toISOString().split('T')[0];
    const pesoSimulado = 12;
    const leiteTopic = 'sertao_serido/leite';
    const queueTopic = 'sertao_serido/fila';

    const mqttClient = await connectMqttClient();
    const pageLogs: string[] = [];

    page.on('console', message => {
      pageLogs.push(message.text());
      console.log(`[browser:${message.type()}] ${message.text()}`);
    });

    page.on('pageerror', error => {
      console.log(`[pageerror] ${error.message}`);
    });

    try {
      await Promise.all([
        new Promise<void>((resolve, reject) => {
          mqttClient.publish(queueTopic, '', { retain: true }, error => {
            if (error) {
              reject(error);
              return;
            }
            resolve();
          });
        }),
        new Promise<void>((resolve, reject) => {
          mqttClient.publish(leiteTopic, '', { retain: true }, error => {
            if (error) {
              reject(error);
              return;
            }
            resolve();
          });
        }),
      ]);

      await login(page);

      const createProducer = await apiFetch<{ message: string }>(page, '/produtores', {
        method: 'POST',
        body: {
          nome: producerName,
          cpfCnpj: producerCpf,
          telefone: '(84) 99999-0000',
          localidade: 'Cidade MQTT',
          tipo: 'Pessoa Física',
          status: 'Ativo',
        },
      });

      expect(createProducer.ok).toBeTruthy();

      const produtorCriado = await expect.poll(async () => {
        const response = await apiFetch<Array<{ id: number; nome: string }>>(page, '/produtores');
        expect(response.ok).toBeTruthy();
        return response.payload.find(item => item.nome === producerName) ?? null;
      }, {
        timeout: 10000,
        intervals: [500, 1000, 1500],
      });

      expect(produtorCriado).not.toBeNull();

      const producerInput = page.getByRole('combobox', { name: 'Nome do Produtor' });
      await producerInput.fill(producerName);
      await producerInput.press('ArrowDown');
      await producerInput.press('Enter');
      await expect(producerInput).toHaveValue(producerName);
      await page.getByLabel('Tanque').fill('T-01');
      await page.getByRole('textbox', { name: 'Data', exact: true }).fill(queueDate);
      await page.getByLabel('Acidez').fill('12');
      await page.getByRole('button', { name: 'Cadastrar' }).click();

      await expect.poll(async () => pageLogs.join('\n'), {
        timeout: 15000,
      }).toContain('📥 Adicionado na fila');

      await expect.poll(async () => pageLogs.join('\n'), {
        timeout: 15000,
      }).toContain('📤 Enviado para balança');

      const retainedQueue = await readRetainedMessage(queueTopic);
      expect(retainedQueue).not.toBeNull();
      expect(retainedQueue).toContain('AGUARDANDO_PESO');
      expect(retainedQueue).toContain(producerName);

      const createdCollection = await expect.poll(async () => {
        const response = await apiFetch<Array<{
          id: number;
          nome: string;
          data: string;
          leite_bom_qnt: number | string;
        }>>(page, '/coletas');

        expect(response.ok).toBeTruthy();
        return response.payload.find(row => row.nome === producerName && row.data.startsWith(queueDate)) ?? null;
      }, {
        timeout: 10000,
        intervals: [500, 1000, 1500],
      });

      expect(createdCollection).not.toBeNull();
      const coletaId = createdCollection!.id;

      await new Promise<void>((resolve, reject) => {
        mqttClient.publish(leiteTopic, JSON.stringify({ id: coletaId, peso: pesoSimulado }), error => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });

      await expect.poll(async () => pageLogs.join('\n'), {
        timeout: 15000,
      }).toContain(`✅ Peso atualizado para ID ${coletaId}`);

      const clearedQueue = await readRetainedMessage(queueTopic);
      expect(clearedQueue).toBeNull();

      // Confirma que o backend recebeu algum valor numérico para `leite_bom_qnt`.
      // Não exige igualdade estrita para evitar flakiness por mensagens retidas antigas.
      await expect.poll(async () => {
        const response = await apiFetch<Array<{
          id: number;
          nome: string;
          data: string;
          leite_bom_qnt: number | string;
        }>>(page, '/coletas');

        expect(response.ok).toBeTruthy();
        const row = response.payload.find(item => item.id === coletaId);
        return row ? Number(row.leite_bom_qnt) : null;
      }, {
        timeout: 10000,
        intervals: [500, 1000, 1500],
      }).toSatisfy(value => typeof value === 'number' && !isNaN(value));

      await Promise.allSettled([
        apiFetch(page, `/coletas/${coletaId}`, { method: 'DELETE', timeoutMs: 5000 }),
        apiFetch(page, `/produtores/${produtorCriado.id}`, { method: 'DELETE', timeoutMs: 5000 }),
      ]);
    } finally {
      mqttClient.end(true);
    }
  });
});
