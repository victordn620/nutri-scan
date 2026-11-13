# NutriScan
App React Native (Expo SDK 58 + TypeScript + Expo Router) para fotografar alimentos, identificar itens com Gemini, consultar a Open Food Facts e registrar um diário alimentar.

## Executar
```bash
npm install
npx expo install --fix   # alinha versões com o SDK instalado
npx expo start           # abra no Expo Go (a câmera exige dispositivo físico)
```

### Servidor de visão
O app não armazena a chave Gemini. Inicie o proxy em outro terminal:
```powershell
$env:GEMINI_API_KEY="sua_chave"
npm run server
```
Defina `EXPO_PUBLIC_VISION_API_URL` no ambiente do Expo com o IP da máquina na rede local (não use `localhost` no celular). Consulte `.env.example`.

## Arquitetura
- `app/` rotas (Expo Router): abas Diário, Scanner por fotografia, Buscar, Histórico + tela `product/[code]`.
- `src/api.ts` cliente Open Food Facts (parâmetro `fields` reduz payload; cancelável com AbortController).
- `src/config.ts` configurações centralizadas de API, cache e paginação.
- `src/db.ts` camada SQLite (migração, índices, WAL, transações, cache de produtos, diário).
- `src/hooks/` lógica reutilizável de carregamento e cache de produto (`useProduct`).
- `src/utils/` cálculos e conversões nutricionais compartilhados.
- `src/components/` componentes memoizados (`ProductRow`, `ProgressBar`).
- `server/` proxy mínimo para Gemini; a chave fica exclusivamente no servidor.

## Otimizações de desempenho
1. Cache-first: produto lido do SQLite antes da API; resultados de busca são persistidos.
2. Busca com debounce (500 ms) e cancelamento de requisições obsoletas.
3. Câmera montada só quando a aba está em foco; trava contra leituras duplicadas.
4. FlatList (`windowSize`, `initialNumToRender`, `removeClippedSubviews`) e `React.memo`.
5. SQLite com WAL, índices e escrita em transação; totais diários calculados com `useMemo`.
6. Respostas da API limitadas aos campos necessários.
7. Requisições com timeout de 10 segundos e cancelamento de buscas obsoletas.
8. Cache SQLite de buscas por 15 minutos e paginação de 20 resultados.
9. Imagens carregadas com cache nativo; o diário e produtos consultados permanecem disponíveis offline.

## Identidade visual
Tokens em `src/theme.ts` (cores, espaçamento 4/8/16/24/32, raios, sombras). Verde-floresta `#0B6B3A` + verde-folha `#34D27B` sobre neutros quentes;
anel de calorias SVG, gráfico semanal (`WeekChart`), barra segmentada de macros no produto, barras animadas, `FadeIn` e moldura de scanner com linha de varredura.
Responsivo: anel proporcional à largura, `maxWidth` 640 em tablets, safe-area insets no scanner e no diário. Animações via `Animated` com driver nativo quando possível.
