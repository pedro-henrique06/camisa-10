# Camisa 10 – Simulador de Carreira

App **React Native (Expo)** do simulador de carreira de futebol. Toda a lógica do jogo roda no backend
[`camisa_10_back`](https://github.com/pedro-henrique06/camisa_10_back) (.NET + MongoDB); o app desenha a tela
que a API devolve e envia as escolhas do jogador.

A versão web original, em um único arquivo, continua em [`legacy/index.html`](legacy/index.html).

## Resumo do jogo
- Comece na base de um clube e siga até a aposentadoria.
- Cada dia tem uma decisão pessoal e um treino; a cada 5 dias há jogo.
- Seis atributos (Ritmo, Chute, Passe, Drible, Defesa, Força) formam o overall, ponderado pela posição.
- Decisões de jogo são testes de d20 contra uma dificuldade, usando o atributo ligado à jogada.
- Cada clube tem sua rotina de treino (um ou dois períodos e um foco).
- Mercado, contratos, copas, seleção, Bola de Ouro, lesões e arcos de história.

## Como rodar

1. Suba o backend (no repositório `camisa_10_back`):

       docker compose up --build

   A API fica em `http://localhost:5080`.

2. Instale e rode o app:

       npm install
       npx expo start

   Abra no Expo Go (celular na mesma rede), num emulador (`a` / `i`) ou no navegador (`w`).

Em desenvolvimento o app procura a API no mesmo IP do computador que roda o Metro, porta 5080.
Para outro endereço, crie `.env.local` a partir de `.env.example` com `EXPO_PUBLIC_API_URL`.

O progresso fica salvo no servidor. O app gera um identificador anônimo do aparelho (guardado no
AsyncStorage) e o envia no cabeçalho `X-Player-Id`, então cada aparelho vê as próprias carreiras e a galeria.

## Publicar no Railway

O repositório já tem um `railway.json`: o Railway gera o site (`npm run build:web`) e o serve na porta
que ele define (`npm run start:web`).

1. No mesmo projeto do backend, **+ Create → GitHub Repo →** `camisa-10`.
2. Em **Variables**, crie `EXPO_PUBLIC_API_URL` com o endereço do backend (ex.:
   `https://camisa10-back-production.up.railway.app`, com `https` e sem barra no final).
3. Em **Settings → Networking**, gere o domínio do site.

O endereço da API entra no site durante o build: se mudar a variável, faça um novo deploy.

## Estrutura

```
src/
  app/                       rotas (Expo Router)
    index.tsx                tela inicial: continuar, galeria, novo jogador
    career/[id]/index.tsx    jogo: HUD + tela da fase atual
    career/[id]/history.tsx  evolução da carreira
  api/                       cliente HTTP e tipos das respostas
  components/                HUD, escudos, campo, troféu, dado, botões
  phases/                    uma tela por fase (calendário, evento, resultado, mercado...)
  theme.ts                   cores (modo escuro e claro)
legacy/index.html            jogo web original
```

## Animações de comemoração (Lottie)

Os efeitos de comemoração usam [`lottie-react-native`](https://github.com/lottie-react-native/lottie-react-native):

| Arquivo | Onde aparece |
| --- | --- |
| `assets/lottie/fogos.json` | gol em lance de jogo e no pênalti |
| `assets/lottie/confete.json` | taça, título da temporada, promoção, Bola de Ouro, fim de carreira de lenda |
| `assets/lottie/raios.json` | raios girando atrás do troféu, da Bola de Ouro e da braçadeira |

As animações são geradas por código, sem arquivos de terceiros:

    python3 tools/lottie/generate.py

Para usar uma animação do [LottieFiles](https://lottiefiles.com), salve o `.json` com o mesmo nome em
`assets/lottie/` (confira a licença dela). Os efeitos não aparecem quando o sistema pede para reduzir
movimento. Na versão web, o Lottie baixa o seu módulo `.wasm` da CDN jsDelivr.

## Verificações

    npm run typecheck
    npm run lint
