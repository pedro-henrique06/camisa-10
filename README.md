# Camisa 10 – Simulador de Carreira

Jogo web de simulador de carreira de futebol em um único arquivo (`index.html`), sem dependências nem build.

## Como rodar
Abra o `index.html` no navegador, ou sirva a pasta:

    python3 -m http.server 8000

O progresso é salvo automaticamente no `localStorage` do navegador.

## Resumo do jogo
- Comece na base de um clube e siga até a aposentadoria.
- Cada dia tem uma decisão pessoal e um treino; a cada 5 dias há jogo.
- Seis atributos (Ritmo, Chute, Passe, Drible, Defesa, Força) formam o overall, ponderado pela posição.
- Decisões de jogo são testes de d20 contra uma dificuldade, usando o atributo ligado à jogada.
- Cada clube tem sua rotina de treino (um ou dois períodos e um foco).
- Mercado, contratos, copas, seleção, Bola de Ouro, lesões e arcos de história.

## Estrutura do código (dentro do `index.html`)
- `E`, `e(...)`: eventos e decisões. Opção: `[rótulo, sucesso, efeitos, prob?, falha?, efeitosFalha?, {a:atributo}?]`.
- `apply(d)`: aplica efeitos ao estado `s`. `pick(i)`: resolve a escolha (inclui o teste de dado, `chk`).
- `next()`: avança o dia. `calScreen()`: calendário e agenda.
- `W`, `ovr()`: pesos por posição e cálculo do overall.
- `market()`, `tpFor()`: mercado de transferências e rotina de treino do clube.
