import type { MatchLine, MatchView } from '@/api/types';

/**
 * Simulação contínua do campinho ao vivo. Coordenadas de 0 a 1 (x ao longo do campo, y na largura);
 * o time do jogador (índices 0 a 10) ataca para a direita e o adversário (11 a 21) para a esquerda.
 *
 * Cada linha da narração vira um lance: o time que ataca toma a bola, troca passes rumo ao alvo do lance
 * e termina como a narração conta (gol, chance, defesa do goleiro, a jogada do jogador). Os jogadores
 * nunca "teletransportam": a cada quadro correm um pouco em direção ao lugar certo, com velocidade máxima.
 */

export type P = { x: number; y: number };
type Focus = MatchView['focus'];

/** Tempo de cada linha da narração. */
export const STEP_MS = 2200;

/** 4-4-2 no próprio campo (x de 0 a 0,5, atacando para a direita). */
const FORMATION: P[] = [
  { x: 0.04, y: 0.5 },
  { x: 0.17, y: 0.14 }, { x: 0.15, y: 0.38 }, { x: 0.15, y: 0.62 }, { x: 0.17, y: 0.86 },
  { x: 0.31, y: 0.16 }, { x: 0.29, y: 0.4 }, { x: 0.29, y: 0.6 }, { x: 0.31, y: 0.84 },
  { x: 0.44, y: 0.38 }, { x: 0.44, y: 0.62 },
];

/** Qual bolinha é o jogador, pela posição. */
export const MY_SLOT: Record<string, number> = { Atacante: 9, Ponta: 5, Meia: 6, Volante: 7, Lateral: 1, Zagueiro: 2 };

const PLAYER_SPEED = 0.2; // campos por segundo
const RUN_SPEED = 0.3; // quem corre para receber ou para marcar
const PASS_SPEED = 0.75;
const SHOT_SPEED = 1.6;

/** Número pseudoaleatório estável (mesma linha, mesma jogada). */
export function rnd(seed: number) {
  const v = Math.sin(seed * 9301 + 49297) * 233280;
  return v - Math.floor(v);
}

const clamp = (v: number, a = 0.02, b = 0.98) => Math.min(b, Math.max(a, v));
const dist = (a: P, b: P) => Math.hypot(a.x - b.x, a.y - b.y);
const lerp = (a: P, b: P, t: number): P => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
const teamOf = (k: number) => (k < 11 ? 0 : 1);
const easeOut = (t: number) => 1 - (1 - t) * (1 - t);

type Action =
  | { at: number; kind: 'pass'; to: number; dest: P }
  | { at: number; kind: 'shot'; dest: P; keeper: number | null }
  | { at: number; kind: 'place'; to: number; dest: P };

type Flight = { from: P; to: P; t0: number; dur: number; receiver: number | null };

export type Sim = {
  pos: P[];
  ball: P;
  holder: number | null;
  flight: Flight | null;
  /** Time com a bola no lance atual (0 = o do jogador). */
  team: 0 | 1;
  line: number;
  lineStart: number;
  plan: Action[];
  next: number;
  /** Corridas combinadas: quem vai receber o passe corre para o lugar do passe. */
  runs: Map<number, P>;
  kickoff: boolean;
  /** Pênalti: todo mundo na entrada da área, o goleiro na linha. */
  penalty: boolean;
  /** Duelo da Mesa: bolinha do amigo no time adversário (-1 fora do duelo). */
  friendSlot: number;
  now: number;
};

function formationFor(team: 0 | 1, k: number): P {
  const p = FORMATION[k];
  return team === 0 ? { x: p.x, y: p.y } : { x: 1 - p.x, y: p.y };
}

/** Quem tem a bola em cada tipo de linha. */
function possession(line: MatchLine, i: number, focus: Focus): 0 | 1 {
  switch (line.type) {
    case 'goal-for':
    case 'chance-for':
    case 'attack-for':
      return 0;
    case 'goal-against':
    case 'chance-against':
    case 'attack-against':
      return 1;
    case 'decision':
      return focus === 'defense' || focus === 'pre' ? 1 : 0;
    case 'whistle':
      return i === 0 ? 0 : rnd(i) < 0.5 ? 0 : 1;
    default:
      return rnd(i * 5 + line.minute) < 0.55 ? 0 : 1;
  }
}

/** Onde o lance termina. */
function targetFor(line: MatchLine, i: number, focus: Focus, team: 0 | 1): P {
  const r = rnd(i + line.minute * 7);
  const fwd = (x: number) => (team === 0 ? x : 1 - x);
  switch (line.type) {
    case 'goal-for':
    case 'goal-against':
    case 'chance-for':
    case 'chance-against':
      return { x: fwd(0.8 + r * 0.06), y: 0.32 + r * 0.36 };
    case 'decision':
      return (
        {
          attack: { x: 0.79, y: 0.42 },
          defense: { x: 0.24, y: 0.55 },
          center: { x: 0.56, y: 0.5 },
          cup: { x: 0.74, y: 0.4 },
          penalty: { x: 0.885, y: 0.5 },
          pre: { x: 0.45, y: 0.5 },
          result: { x: 0.5, y: 0.5 },
        } as const
      )[focus];
    case 'whistle':
      return { x: 0.5, y: 0.5 };
    case 'attack-for':
    case 'attack-against':
      return { x: fwd(0.55 + r * 0.2), y: 0.15 + rnd(i * 3 + 1) * 0.7 };
    default:
      return { x: fwd(0.35 + r * 0.35), y: 0.15 + rnd(i * 3 + 1) * 0.7 };
  }
}

/** Companheiro mais perto de `spot` (sem o goleiro e sem quem está com a bola). */
function nearestMate(sim: Sim, team: 0 | 1, spot: P, except: number | null): number {
  let best = -1;
  let bd = 9;
  for (let k = team * 11 + 1; k < team * 11 + 11; k++) {
    if (k === except) continue;
    const d = dist(sim.pos[k], spot);
    if (d < bd) [best, bd] = [k, d];
  }
  return best;
}

function planLine(sim: Sim, lines: MatchLine[], i: number, focus: Focus, mySlot: number) {
  const line = lines[i];
  const team = possession(line, i, focus);
  const target = targetFor(line, i, focus, team);
  const step = STEP_MS / 1000;
  const acts: Action[] = [];
  sim.runs.clear();
  sim.team = team;
  sim.kickoff = line.type === 'whistle';
  sim.penalty = line.type === 'decision' && focus === 'penalty';

  // reinício (apito ou depois de um gol): bola no meio com o atacante de quem sai jogando
  const afterGoal = i > 0 && lines[i - 1].type.startsWith('goal');
  if (line.type === 'whistle' || afterGoal) {
    const striker = team * 11 + 9;
    acts.push({ at: 0, kind: 'place', to: striker, dest: { x: 0.5, y: 0.5 } });
    if (line.type === 'whistle') {
      sim.plan = acts;
      sim.next = 0;
      return;
    }
  }

  // toma a bola: o mais perto do time que ataca chega nela
  let holder = afterGoal ? team * 11 + 9 : sim.holder;
  let ballAt = afterGoal ? { x: 0.5, y: 0.5 } : sim.flight ? sim.flight.to : sim.ball;
  if (holder == null || teamOf(holder) !== team) {
    const k = nearestMate(sim, team, ballAt, null);
    acts.push({ at: afterGoal ? 0.35 : 0.05, kind: 'pass', to: k, dest: ballAt });
    holder = k;
  }

  // passes rumo ao alvo
  const isShot = line.type.startsWith('goal') || line.type.startsWith('chance');
  const passes = isShot ? 3 : line.type === 'decision' ? 2 : 2 + Math.floor(rnd(i * 11) * 2);
  let t = afterGoal ? 0.55 : 0.3;
  const span = (isShot ? 0.62 : 0.85) * step - t;
  for (let n = 0; n < passes; n++) {
    const last = n === passes - 1;
    const wp = last ? target : lerp(ballAt, target, (n + 1) / (passes + 0.5));
    const spot = { x: clamp(wp.x + (rnd(i * 13 + n) - 0.5) * 0.06, 0.06, 0.94), y: clamp(wp.y + (rnd(i * 19 + n) - 0.5) * 0.12, 0.06, 0.94) };
    // a jogada do jogador termina nele
    // no duelo, o lance termina com quem decidiu: você ataca, ou o amigo vem para cima de você
    const finisher = sim.friendSlot >= 0 && isShot ? (team === 0 ? mySlot : sim.friendSlot) : -1;
    const to: number =
      last && finisher >= 0 ? finisher : last && line.type === 'decision' && team === 0 ? mySlot : nearestMate(sim, team, spot, holder === finisher ? null : holder);
    acts.push({ at: t, kind: 'pass', to, dest: spot });
    sim.runs.set(to, spot);
    holder = to;
    ballAt = spot;
    t += span / passes;
  }

  // duelo: quem defende vai marcar quem decide o lance
  if (sim.friendSlot >= 0 && isShot) sim.runs.set(team === 0 ? sim.friendSlot : mySlot, { x: clamp(target.x + (team === 0 ? 0.05 : -0.05)), y: clamp(target.y - 0.04) });

  // lance decisivo na defesa: o adversário vem com a bola e você vai para cima dele
  if (line.type === 'decision' && team === 1) sim.runs.set(mySlot, { x: clamp(target.x - 0.05), y: clamp(target.y + 0.05) });

  if (isShot) {
    const attackRight = team === 0;
    const keeper = attackRight ? 11 : 0;
    const goal = line.type.startsWith('goal');
    const goalX = attackRight ? 1.0 : 0.0;
    const r = rnd(i * 23);
    // gol: no canto; chance: para fora ou na mão do goleiro
    const dest = goal
      ? { x: goalX, y: 0.45 + r * 0.1 }
      : r < 0.5
        ? { x: attackRight ? 0.97 : 0.03, y: 0.5 + (r - 0.25) * 0.4 }
        : { x: goalX, y: r < 0.75 ? 0.36 : 0.64 };
    acts.push({ at: 0.72 * step, kind: 'shot', dest, keeper: !goal && r < 0.5 ? keeper : null });
  }

  sim.plan = acts;
  sim.next = 0;
}

export function createSim(lines: MatchLine[], focus: Focus, mySlot: number, friendSlot = -1): Sim {
  const pos = Array.from({ length: 22 }, (_, k) => formationFor(teamOf(k) as 0 | 1, k % 11));
  const sim: Sim = {
    pos,
    ball: { x: 0.5, y: 0.5 },
    holder: 9,
    flight: null,
    team: 0,
    line: -1,
    lineStart: 0,
    plan: [],
    next: 0,
    runs: new Map(),
    kickoff: true,
    penalty: false,
    friendSlot,
    now: 0,
  };
  // começa do jeito que o trecho anterior terminou: bola no ponto do primeiro lance
  if (lines.length && lines[0].type !== 'whistle') {
    const team = possession(lines[0], 0, focus);
    const start = lerp({ x: 0.5, y: 0.5 }, targetFor(lines[0], 0, focus, team), 0.5);
    sim.ball = start;
    sim.kickoff = false;
    sim.team = team;
    sim.holder = nearestMate(sim, team, start, null);
    for (let k = 0; k < 22; k++) sim.pos[k] = targetOf(sim, k, mySlot);
    sim.ball = { ...sim.pos[sim.holder] };
  }
  return sim;
}

/** Linha de cada jogador no 4-4-2: 0 zaga, 1 meio, 2 ataque (o goleiro é tratado à parte). */
const LINE = [0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2];

/**
 * Lugar ideal de cada jogador agora, como num time de verdade: a zaga acompanha a bola a uma distância
 * segura, o meio e o ataque ficam escalonados à frente dela, quem ataca abre o campo e quem defende fecha
 * em direção à bola. "u" é a posição na direção do ataque do time (0 = o próprio gol, 1 = o gol adversário).
 */
function targetOf(sim: Sim, k: number, mySlot: number): P {
  const team = teamOf(k) as 0 | 1;
  const slot = k % 11;
  const base = formationFor(team, slot);
  const ball = sim.ball;
  if (sim.kickoff) return base;
  if (sim.penalty && k !== mySlot) {
    if (k === 11) return { x: 0.975, y: 0.5 };
    if (k === 0) return base;
    return team === 1 ? { x: clamp(0.72 + rnd(k) * 0.06), y: 0.2 + (slot / 11) * 0.6 } : { x: clamp(0.7 + rnd(k + 5) * 0.06), y: 0.15 + (slot / 11) * 0.7 };
  }
  const toX = (u: number) => (team === 0 ? u : 1 - u);
  const ballU = team === 0 ? ball.x : 1 - ball.x;
  if (slot === 0) return { x: toX(0.035 + Math.max(0, ballU - 0.5) * 0.12), y: clamp(0.5 + (ball.y - 0.5) * 0.3, 0.38, 0.62) };
  if (sim.runs.has(k)) return sim.runs.get(k)!;
  const attacking = sim.team === team;
  // a linha de zaga segue a bola sem encostar nela; as outras linhas ficam a uma distância fixa
  const defLine = attacking ? clamp(ballU - 0.36, 0.14, 0.55) : clamp(ballU - 0.22, 0.08, 0.42);
  const gap = attacking ? 0.19 : 0.15;
  const line = LINE[slot];
  let u = defLine + line * gap;
  if (line === 2) u = Math.min(u, attacking ? 0.88 : 0.6);
  // laterais sobem quando o time ataca
  if (attacking && (slot === 1 || slot === 4)) u += 0.07;
  // largura: quem ataca abre o campo, quem defende fecha em direção à bola
  const width = attacking ? 1.08 : 0.76;
  // margem nas laterais: a bolinha (e o nome em cima dela) não fica cortada na borda do campo
  const y = clamp(0.5 + (base.y - 0.5) * width + (ball.y - 0.5) * (attacking ? 0.16 : 0.32), 0.1, 0.92);
  const p = { x: clamp(toX(u), 0.05, 0.95), y };
  // o jogador do usuário, quando o lance é dele, fica perto da bola
  if (k === mySlot && sim.holder !== k && attacking) return lerp(p, ball, 0.25);
  return p;
}

/**
 * Quem vai na bola: do time que defende, o mais perto dá o bote e o segundo faz a cobertura atrás dele;
 * do time que ataca, o mais perto se oferece ao lado (para o passe), sem encostar em quem conduz.
 */
function pressers(sim: Sim): Map<number, P> {
  const out = new Map<number, P>();
  if (sim.kickoff || sim.penalty) return out;
  const ball = sim.flight ? sim.flight.to : sim.ball;
  for (const team of [0, 1] as const) {
    const near: { k: number; d: number }[] = [];
    for (let k = team * 11 + 1; k < team * 11 + 11; k++) {
      if (k === sim.holder || sim.runs.has(k)) continue;
      near.push({ k, d: dist(sim.pos[k], ball) });
    }
    near.sort((a, b) => a.d - b.d);
    const back = team === 0 ? -1 : 1; // em direção ao próprio gol
    if (sim.team !== team) {
      const [first, second] = near;
      if (first) out.set(first.k, { x: clamp(ball.x + back * 0.035), y: clamp(ball.y + (sim.pos[first.k].y < ball.y ? -0.02 : 0.02), 0.08, 0.94) });
      if (second) out.set(second.k, { x: clamp(ball.x + back * 0.11), y: clamp(ball.y + (ball.y < 0.5 ? 0.09 : -0.09), 0.08, 0.94) });
    } else if (near[0] && near[0].d < 0.3) {
      const side = sim.pos[near[0].k].y < ball.y ? -1 : 1;
      out.set(near[0].k, { x: clamp(ball.x - back * 0.06), y: clamp(ball.y + side * 0.14, 0.1, 0.92) });
    }
  }
  return out;
}

/** Ninguém fica em cima de ninguém: bolinhas muito perto se afastam um pouco. */
function separate(sim: Sim) {
  const min = 0.034;
  for (let i = 0; i < 22; i++) {
    for (let j = i + 1; j < 22; j++) {
      const a = sim.pos[i];
      const b = sim.pos[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d = Math.hypot(dx, dy);
      if (d >= min || d === 0) continue;
      const push = (min - d) / 2;
      const ux = dx / d;
      const uy = dy / d;
      // quem está com a bola não é empurrado
      if (i !== sim.holder) sim.pos[i] = { x: a.x - ux * push, y: a.y - uy * push };
      if (j !== sim.holder) sim.pos[j] = { x: b.x + ux * push, y: b.y + uy * push };
    }
  }
}

/** Avança a simulação até o tempo `now` (ms), em passos curtos. */
export function stepSim(sim: Sim, now: number, lines: MatchLine[], focus: Focus, mySlot: number) {
  while (sim.now < now) {
    const dt = Math.min(1 / 30, (now - sim.now) / 1000);
    sim.now += dt * 1000;
    tick(sim, dt, lines, focus, mySlot);
  }
}

/** Linha da narração no tempo `now`. */
export const lineAt = (now: number, count: number) => Math.min(count - 1, Math.floor(now / STEP_MS));

function tick(sim: Sim, dt: number, lines: MatchLine[], focus: Focus, mySlot: number) {
  // nova linha da narração: monta o lance
  const li = lineAt(sim.now, lines.length);
  if (li !== sim.line && li >= 0) {
    sim.line = li;
    sim.lineStart = li * STEP_MS;
    planLine(sim, lines, li, focus, mySlot);
  }

  // ações do lance que chegaram na hora
  const elapsed = (sim.now - sim.lineStart) / 1000;
  while (sim.next < sim.plan.length && sim.plan[sim.next].at <= elapsed) {
    const a = sim.plan[sim.next++];
    if (a.kind === 'place') {
      sim.flight = { from: { ...sim.ball }, to: a.dest, t0: sim.now, dur: 350, receiver: a.to };
      sim.holder = null;
    } else {
      const from = { ...sim.ball };
      const speed = a.kind === 'shot' ? SHOT_SPEED : PASS_SPEED;
      const dur = Math.max(180, (dist(from, a.dest) / speed) * 1000);
      sim.flight = { from, to: a.dest, t0: sim.now, dur, receiver: a.kind === 'pass' ? a.to : a.keeper };
      sim.holder = null;
    }
  }

  // bola: em voo ou no pé de alguém
  if (sim.flight) {
    const f = sim.flight;
    const p = Math.min(1, (sim.now - f.t0) / f.dur);
    sim.ball = lerp(f.from, f.to, easeOut(p));
    if (p >= 1) {
      sim.flight = null;
      sim.holder = f.receiver;
      if (f.receiver != null) sim.runs.delete(f.receiver);
    }
  } else if (sim.holder != null) {
    const h = sim.pos[sim.holder];
    const dir = teamOf(sim.holder) === 0 ? 1 : -1;
    const want = { x: h.x + dir * 0.012, y: h.y + 0.004 };
    sim.ball = lerp(sim.ball, want, 1 - Math.exp(-dt * 18));
  }

  // jogadores
  const press = pressers(sim);
  for (let k = 0; k < 22; k++) {
    let target: P;
    let speed = PLAYER_SPEED;
    if (k === sim.holder) {
      // conduz a bola um pouco para a frente
      const dir = teamOf(k) === 0 ? 1 : -1;
      target = { x: clamp(sim.pos[k].x + dir * 0.05, 0.05, 0.95), y: sim.pos[k].y };
      speed = 0.12;
    } else if (sim.flight && sim.flight.receiver === k) {
      target = sim.flight.to;
      speed = RUN_SPEED;
    } else if (press.has(k)) {
      target = press.get(k)!;
      speed = RUN_SPEED;
    } else {
      target = targetOf(sim, k, mySlot);
      if (sim.runs.has(k)) speed = RUN_SPEED;
    }
    const p = sim.pos[k];
    const dx = target.x - p.x;
    const dy = target.y - p.y;
    const d = Math.hypot(dx, dy);
    if (d < 1e-4) continue;
    // anda mais devagar perto do alvo (sem tranco) e nunca passa da velocidade máxima
    const move = Math.min(d, speed * dt, d * dt * 4.5);
    sim.pos[k] = { x: p.x + (dx / d) * move, y: p.y + (dy / d) * move };
  }
  separate(sim);
}

/**
 * Quanto o time do jogador está atacando (0 a 1) para a barra de ataque: quem tem a bola e onde ela está.
 */
export function attackShare(sim: Sim): number {
  const ball = sim.flight ? sim.flight.to : sim.ball;
  if (sim.kickoff) return 0.5;
  const v = 0.5 + (sim.team === 0 ? 0.12 : -0.12) + (ball.x - 0.5) * 0.7;
  return Math.min(0.92, Math.max(0.08, v));
}
