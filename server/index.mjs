import { createServer } from 'node:http';

const port = Number(process.env.PORT ?? 8787);
const apiKey = process.env.GEMINI_API_KEY;
const model = (process.env.GEMINI_MODEL ?? 'gemini-flash-latest').replace(/^models\//, '');
const geminiTimeoutMs = Number(process.env.GEMINI_TIMEOUT_MS ?? 30000);
const maxAttempts = Number(process.env.GEMINI_MAX_ATTEMPTS ?? 2);
const retryableStatus = new Set([408, 429, 500, 502, 503, 504]);
const fallbackModels = [
  model,
  'gemini-3.5-flash-lite',
  'gemini-flash-lite-latest',
].filter((name, index, names) => name && names.indexOf(name) === index);

const send = (res, status, body) => {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(body));
};

const readBody = (req) => new Promise((resolve, reject) => {
  let body = '';
  req.on('data', (chunk) => {
    body += chunk;
    if (body.length > 12_000_000) req.destroy(new Error('Payload muito grande.'));
  });
  req.on('end', () => {
    try { resolve(JSON.parse(body)); } catch { reject(new Error('JSON inválido.')); }
  });
  req.on('error', reject);
});

const server = createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/health') return send(res, 200, { ok: true });
  if (req.method === 'OPTIONS') return send(res, 204, {});
  if (req.method !== 'POST' || req.url !== '/api/identify-foods') return send(res, 404, { error: 'Rota não encontrada.' });
  if (!apiKey) return send(res, 500, { error: 'GEMINI_API_KEY não configurada no servidor.' });

  try {
    const body = await readBody(req);
    if (typeof body?.imageBase64 !== 'string' || body.imageBase64.length < 100) {
      return send(res, 400, { error: 'Imagem inválida.' });
    }
    let gemini;
    let lastTimeout = false;
    for (let attempt = 0; attempt < Math.max(maxAttempts, fallbackModels.length); attempt += 1) {
      const attemptModel = fallbackModels[Math.min(attempt, fallbackModels.length - 1)];
      lastTimeout = false;
      gemini = undefined;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), geminiTimeoutMs);
      try {
        gemini = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${attemptModel}:generateContent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
          signal: controller.signal,
          body: JSON.stringify({
        contents: [{ parts: [
          { text: 'Identifique rapidamente todos os alimentos visíveis nesta foto. Separe componentes de pratos mistos. Use nomes simples em português. Não adivinhe itens ocultos e não informe nutrientes. Responda apenas JSON: {"foods":[{"name":"string","confidence":0.0}]}. Inclua apenas confiança >= 0.55.' },
          { inline_data: { mime_type: 'image/jpeg', data: body.imageBase64 } },
        ] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.1, maxOutputTokens: 160 },
          }),
        });
      } catch (error) {
        if (error?.name === 'AbortError') {
          lastTimeout = true;
          console.warn(`Gemini excedeu ${geminiTimeoutMs} ms (tentativa ${attempt + 1}/${maxAttempts}).`);
        } else {
          throw error;
        }
      } finally {
        clearTimeout(timeout);
      }
      if (!lastTimeout && gemini && !retryableStatus.has(gemini.status)) break;
      if (gemini?.status === 404) break;
      if (attempt < Math.max(maxAttempts, fallbackModels.length) - 1) {
        const retryAfter = gemini?.headers?.get('retry-after');
        const parsedRetryAfter = retryAfter && /^\d+$/.test(retryAfter) ? Number(retryAfter) * 1000 : null;
        const delayMs = parsedRetryAfter ? Math.min(parsedRetryAfter, 5000) : 500 * (attempt + 1);
        console.warn(`Nova tentativa com ${attemptModel === fallbackModels.at(-1) ? fallbackModels[0] : fallbackModels[attempt + 1]} em ${delayMs} ms (HTTP ${gemini?.status ?? 'timeout'}).`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
    if (!gemini && lastTimeout) {
      return send(res, 504, { error: 'O Gemini demorou muito para responder. Tente novamente em alguns instantes.' });
    }
    if (!gemini.ok) {
      const details = await gemini.text();
      console.error(`Gemini respondeu ${gemini.status}: ${details.slice(0, 500)}`);
      if (gemini.status === 503) {
        return send(res, 503, { error: 'O Gemini está temporariamente sobrecarregado. Aguarde alguns segundos e tente novamente.' });
      }
      if (gemini.status === 429) {
        return send(res, 429, { error: 'O limite de solicitações do Gemini foi atingido. Aguarde antes de tentar novamente.' });
      }
      if (gemini.status === 404) {
        return send(res, 502, { error: 'Nenhum modelo Gemini disponível foi encontrado para esta chave. Atualize a configuração da chave/modelo.' });
      }
      return send(res, 502, { error: `Gemini recusou a solicitação (HTTP ${gemini.status}).` });
    }
    const result = await gemini.json();
    const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof text !== 'string' || !text.trim()) {
      console.error('Gemini não retornou conteúdo:', JSON.stringify(result).slice(0, 500));
      return send(res, 502, { error: 'O Gemini não retornou uma identificação.' });
    }
    const parsed = JSON.parse(text);
    const foods = Array.isArray(parsed.foods) ? parsed.foods
      .filter((food) => typeof food?.name === 'string' && typeof food?.confidence === 'number')
      .map((food, index) => ({ id: `${Date.now()}-${index}`, name: food.name.trim(), confidence: Math.max(0, Math.min(1, food.confidence)) }))
      .filter((food) => food.name && food.confidence >= 0.55) : [];
    return send(res, 200, { foods });
  } catch (error) {
    const message = error?.name === 'AbortError'
      ? 'O Gemini demorou muito para responder.'
      : error instanceof Error ? error.message : 'Erro desconhecido.';
    console.error('Falha ao analisar fotografia:', message);
    return send(res, error?.name === 'AbortError' ? 504 : 500, { error: message });
  }
});

server.listen(port, '0.0.0.0', () => console.log(`NutriScan Vision API em http://0.0.0.0:${port} usando ${model}`));
