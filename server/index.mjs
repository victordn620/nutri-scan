import { createServer } from 'node:http';

const port = Number(process.env.PORT ?? 8787);
const apiKey = process.env.GEMINI_API_KEY;
const model = (process.env.GEMINI_MODEL ?? 'gemini-flash-latest').replace(/^models\//, '');
const geminiTimeoutMs = 20000;

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
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), geminiTimeoutMs);
      try {
        gemini = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
          signal: controller.signal,
          body: JSON.stringify({
        contents: [{ parts: [
          { text: 'Você é um reconhecedor visual de alimentos. Analise toda a fotografia e tente identificar cada alimento visível individualmente, incluindo itens in natura e refeições caseiras, não apenas produtos industrializados. Reconheça frutas; verduras e legumes; carnes; arroz, feijão e outros grãos; massas; pães; ovos; laticínios; refeições completas e outros alimentos comuns. Em pratos mistos, liste separadamente cada componente identificável (por exemplo: arroz, feijão, frango e salada). Não invente alimentos que não estejam visíveis, não deduza ingredientes ocultos e não forneça valores nutricionais. Responda somente JSON no formato {"foods":[{"name":"string","confidence":0.0}]}. Use nomes simples em português e inclua apenas itens com confiança igual ou superior a 0.55.' },
          { inline_data: { mime_type: 'image/jpeg', data: body.imageBase64 } },
        ] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.1 },
          }),
        });
      } finally {
        clearTimeout(timeout);
      }
      if (![429, 500, 503].includes(gemini.status) || attempt === 1) break;
      console.warn(`Gemini indisponível (HTTP ${gemini.status}); tentando novamente.`);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    if (!gemini.ok) {
      const details = await gemini.text();
      console.error(`Gemini respondeu ${gemini.status}: ${details.slice(0, 500)}`);
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
