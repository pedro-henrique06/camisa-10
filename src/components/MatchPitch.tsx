import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Rect } from 'react-native-svg';

import type { MatchLine, MatchView } from '@/api/types';
import { Badge } from '@/components/art';
import { haptic } from '@/components/ui';
import { alpha, compColor, condensed, font, useTheme } from '@/theme';

const STEP_MS = 1250;
const RATIO = 0.62;
const DOT = 11;
const ME = 15;

type P = { x: number; y: number };

/** 4-4-2 no próprio campo (x de 0 a 0,5, atacando para a direita). */
const FORMATION: P[] = [
  { x: 0.04, y: 0.5 },
  { x: 0.17, y: 0.14 }, { x: 0.15, y: 0.38 }, { x: 0.15, y: 0.62 }, { x: 0.17, y: 0.86 },
  { x: 0.31, y: 0.16 }, { x: 0.29, y: 0.4 }, { x: 0.29, y: 0.6 }, { x: 0.31, y: 0.84 },
  { x: 0.44, y: 0.38 }, { x: 0.44, y: 0.62 },
];

/** Qual bolinha é o jogador, pela posição. */
const MY_SLOT: Record<string, number> = { Atacante: 9, Ponta: 5, Meia: 6, Volante: 7, Lateral: 1, Zagueiro: 2 };

/** Número pseudoaleatório estável (mesma linha, mesma jogada). */
function rnd(seed: number) {
  const v = Math.sin(seed * 9301 + 49297) * 233280;
  return v - Math.floor(v);
}

const clamp = (v: number, a = 0.02, b = 0.98) => Math.min(b, Math.max(a, v));

/** Onde a bola vai em cada tipo de linha da narração (o time do jogador ataca para a direita). */
function ballFor(line: MatchLine, focus: MatchView['focus'], i: number): P {
  const r = rnd(i + line.minute * 7);
  switch (line.type) {
    case 'goal-for':
      return { x: 0.985, y: 0.46 + r * 0.08 };
    case 'goal-against':
      return { x: 0.015, y: 0.46 + r * 0.08 };
    case 'chance-for':
      return { x: 0.84 + r * 0.06, y: 0.3 + r * 0.4 };
    case 'chance-against':
      return { x: 0.1 + r * 0.06, y: 0.3 + r * 0.4 };
    case 'whistle':
      return { x: 0.5, y: 0.5 };
    case 'decision':
      return (
        {
          attack: { x: 0.79, y: 0.42 },
          defense: { x: 0.22, y: 0.55 },
          center: { x: 0.56, y: 0.5 },
          cup: { x: 0.74, y: 0.4 },
          penalty: { x: 0.885, y: 0.5 },
          pre: { x: 0.5, y: 0.5 },
          result: { x: 0.5, y: 0.5 },
        } as const
      )[focus];
    default:
      return { x: 0.3 + r * 0.4, y: 0.15 + rnd(i * 3 + 1) * 0.7 };
  }
}

/** Posições dos 22 jogadores com a bola em `ball`: o time se desloca com ela e os mais perto correm atrás. */
function arrange(ball: P, line: MatchLine, focus: MatchView['focus'], mySlot: number, i: number) {
  const kickoff = line.type === 'whistle';
  const shift = kickoff ? 0 : ball.x - 0.5;
  const mine = FORMATION.map((p, k) => {
    if (k === 0) return { x: 0.04 + Math.max(0, shift) * 0.08, y: clamp(0.5 + (ball.y - 0.5) * 0.3) };
    return {
      x: clamp(p.x + 0.06 + shift * 0.45 + (rnd(i * 31 + k) - 0.5) * 0.04, 0.08, 0.92),
      y: clamp(p.y + (ball.y - 0.5) * 0.3 + (rnd(i * 17 + k) - 0.5) * 0.06),
    };
  });
  const opp = FORMATION.map((p, k) => {
    if (k === 0) return { x: 0.96 - Math.max(0, -shift) * 0.08, y: clamp(0.5 + (ball.y - 0.5) * 0.3) };
    return {
      x: clamp(1 - (p.x + 0.06 - shift * 0.45) + (rnd(i * 13 + k) - 0.5) * 0.04, 0.08, 0.92),
      y: clamp(p.y + (ball.y - 0.5) * 0.3 + (rnd(i * 7 + k) - 0.5) * 0.06),
    };
  });
  if (!kickoff) {
    // os mais próximos de cada time correm atrás da bola
    const near = (list: P[]) =>
      list.map((p, k) => ({ k, d: k === 0 ? 9 : Math.hypot(p.x - ball.x, p.y - ball.y) })).sort((a, b) => a.d - b.d).slice(0, 2);
    near(mine).forEach(({ k }, n) => (mine[k] = { x: clamp(ball.x - 0.03 - n * 0.05), y: clamp(ball.y + (n ? 0.08 : 0.02)) }));
    near(opp).forEach(({ k }, n) => (opp[k] = { x: clamp(ball.x + 0.03 + n * 0.05), y: clamp(ball.y - (n ? 0.08 : 0.03)) }));
  }
  if (line.type === 'decision') {
    // no lance decisivo, a bola está com você (ou você vai para cima de quem está com ela)
    const withBall = focus !== 'defense' && focus !== 'pre';
    mine[mySlot] = withBall ? { x: clamp(ball.x - 0.02), y: ball.y } : { x: clamp(ball.x - 0.05), y: clamp(ball.y + 0.05) };
    if (focus === 'penalty') {
      opp.forEach((p, k) => k > 0 && (opp[k] = { x: clamp(0.72 + rnd(k) * 0.06), y: 0.2 + (k / 11) * 0.6 }));
      mine.forEach((p, k) => k > 0 && k !== mySlot && (mine[k] = { x: clamp(0.7 + rnd(k + 5) * 0.06), y: 0.15 + (k / 11) * 0.7 }));
      opp[0] = { x: 0.975, y: 0.5 };
    }
  }
  return { mine, opp };
}

/** Cor dos adversários: a principal, ou a secundária quando é parecida com a nossa. */
function opponentColor(m: MatchView) {
  const same = m.opponentBadge.primary.toLowerCase() === m.teamBadge.primary.toLowerCase();
  return same ? m.opponentBadge.secondary : m.opponentBadge.primary;
}

/**
 * Jogo ao vivo: placar, campo com as bolinhas correndo atrás da bola e a narração.
 * Toca as linhas uma a uma e chama `onDone` no fim (ou quando o jogador toca para pular).
 */
export function MatchPitch({ match, onDone }: { match: MatchView; onDone?: () => void }) {
  const t = useTheme();
  const [width, setWidth] = useState(0);
  const [idx, setIdx] = useState(-1);
  const [done, setDone] = useState(false);
  const [dots] = useState(() => Array.from({ length: 22 }, () => new Animated.ValueXY({ x: -50, y: -50 })));
  const [ball] = useState(() => new Animated.ValueXY({ x: -50, y: -50 }));
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const lines = match.lines;
  const mySlot = MY_SLOT[match.position] ?? 6;
  const height = width * RATIO;

  const place = (i: number, ms: number) => {
    const line = lines[i];
    if (!line || !width) return;
    const b = ballFor(line, match.focus, i);
    const { mine, opp } = arrange(b, line, match.focus, mySlot, i);
    const px = (p: P, size: number) => ({ x: p.x * width - size / 2, y: p.y * height - size / 2 });
    const all = [...mine, ...opp];
    if (ms === 0) {
      all.forEach((p, k) => dots[k].setValue(px(p, k === mySlot ? ME : DOT)));
      ball.setValue(px(b, 8));
      return;
    }
    const easing = Easing.inOut(Easing.quad);
    Animated.parallel(
      all.map((p, k) => Animated.timing(dots[k], { toValue: px(p, k === mySlot ? ME : DOT), duration: ms * 0.9, easing, useNativeDriver: true })),
    ).start();
    // a bola passa por um companheiro antes de chegar ao destino
    const mid = { x: clamp((b.x + 0.5) / 2 + (rnd(i) - 0.5) * 0.2), y: clamp(0.2 + rnd(i + 9) * 0.6) };
    Animated.sequence([
      Animated.timing(ball, { toValue: px(mid, 8), duration: ms * 0.4, easing, useNativeDriver: true }),
      Animated.timing(ball, { toValue: px(b, 8), duration: ms * 0.45, easing, useNativeDriver: true }),
    ]).start();
  };

  const finish = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setIdx(lines.length - 1);
    place(lines.length - 1, 250);
    setDone(true);
    onDone?.();
  };

  useEffect(() => {
    if (!width) return;
    let cancelled = false;
    (async () => {
      let reduce = false;
      try {
        reduce = await AccessibilityInfo.isReduceMotionEnabled();
      } catch {}
      if (cancelled) return;
      if (reduce || lines.length === 0) {
        timers.current.push(setTimeout(finish, 0));
        return;
      }
      // começa do jeito que o trecho anterior terminou
      place(0, 0);
      lines.forEach((line, i) => {
        timers.current.push(
          setTimeout(() => {
            setIdx(i);
            place(i, STEP_MS);
            if (line.type === 'goal-for') haptic.success();
            if (line.type === 'goal-against') haptic.fail();
          }, i * STEP_MS),
        );
      });
      timers.current.push(
        setTimeout(() => {
          setDone(true);
          onDone?.();
        }, lines.length * STEP_MS),
      );
    })();
    return () => {
      cancelled = true;
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width]);

  const cur = idx >= 0 ? lines[idx] : null;
  const prev = idx >= 1 ? lines[idx - 1] : null;
  const f = cur ? cur.for : match.startFor;
  const a = cur ? cur.against : match.startAgainst;
  const [hs, as] = match.home ? [f, a] : [a, f];
  const [hn, an] = match.home ? [match.team, match.opponent] : [match.opponent, match.team];
  const [hb, ab] = match.home ? [match.teamBadge, match.opponentBadge] : [match.opponentBadge, match.teamBadge];
  const minute = cur ? cur.minute : lines[0]?.minute ?? 0;
  const comp = compColor(t, match.kind);
  const myColor = match.teamBadge.primary;
  const oppColor = opponentColor(match);
  const tone = (l: MatchLine | null) =>
    !l ? t.cardHi
    : l.type === 'goal-for' ? alpha(t.good, 0.22)
    : l.type === 'goal-against' ? alpha(t.bad, 0.22)
    : l.type === 'decision' ? t.accSoft
    : t.cardHi;

  return (
    <View style={styles.wrap}>
      <View style={[styles.board, { backgroundColor: t.cardHi, borderColor: alpha(comp, 0.5) }]}>
        <View style={styles.side}>
          <Badge badge={hb} size={24} />
          <Text numberOfLines={1} style={[styles.team, { color: t.ink }]}>{hn}</Text>
        </View>
        <View style={styles.center}>
          <Text style={[condensed, styles.score, { color: t.ink }]}>
            {hs} <Text style={{ color: t.mut }}>x</Text> {as}
          </Text>
          <Text style={[styles.minute, { color: match.final && done ? t.mut : t.bad }]}>
            {match.final && done ? 'FIM' : `${minute}'`}
          </Text>
        </View>
        <View style={[styles.side, { justifyContent: 'flex-end' }]}>
          <Text numberOfLines={1} style={[styles.team, { color: t.ink, textAlign: 'right' }]}>{an}</Text>
          <Badge badge={ab} size={24} />
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={done ? 'Campo do jogo' : 'Pular a narração'}
        onPress={done ? undefined : finish}
        onLayout={(e) => setWidth(Math.round(e.nativeEvent.layout.width))}
        style={[styles.pitch, { height: height || 180 }]}
      >
        {width > 0 && (
          <>
            <Svg width={width} height={height} viewBox="0 0 100 62">
              {Array.from({ length: 10 }, (_, k) => (
                <Rect key={k} x={k * 10} y={0} width={10} height={62} fill={k % 2 ? '#2f8a4c' : '#2a7f45'} />
              ))}
              <Rect x={1} y={1} width={98} height={60} fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth={0.5} />
              <Line x1={50} y1={1} x2={50} y2={61} stroke="rgba(255,255,255,0.7)" strokeWidth={0.5} />
              <Circle cx={50} cy={31} r={8} fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth={0.5} />
              <Rect x={1} y={15} width={15} height={32} fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth={0.5} />
              <Rect x={84} y={15} width={15} height={32} fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth={0.5} />
              <Rect x={1} y={24} width={5} height={14} fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth={0.5} />
              <Rect x={94} y={24} width={5} height={14} fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth={0.5} />
              <Rect x={0} y={27} width={1} height={8} fill="rgba(255,255,255,0.85)" />
              <Rect x={99} y={27} width={1} height={8} fill="rgba(255,255,255,0.85)" />
              <Circle cx={88.5} cy={31} r={0.5} fill="rgba(255,255,255,0.8)" />
              <Circle cx={11.5} cy={31} r={0.5} fill="rgba(255,255,255,0.8)" />
            </Svg>
            {dots.map((v, k) => {
              const me = k === mySlot;
              const mineTeam = k < 11;
              const size = me ? ME : DOT;
              return (
                <Animated.View
                  key={k}
                  style={[
                    styles.dot,
                    {
                      width: size,
                      height: size,
                      borderRadius: size / 2,
                      backgroundColor: me ? t.acc : mineTeam ? myColor : oppColor,
                      borderColor: me ? '#10261c' : 'rgba(255,255,255,0.85)',
                      borderWidth: me ? 2 : 1.2,
                      zIndex: me ? 3 : 1,
                      transform: v.getTranslateTransform(),
                    },
                  ]}
                />
              );
            })}
            <Animated.View style={[styles.ball, { transform: ball.getTranslateTransform() }]} />
            {!done && (
              <View style={styles.skip}>
                <Text style={styles.skipText}>Toque para pular ›</Text>
              </View>
            )}
          </>
        )}
      </Pressable>

      <View style={[styles.feed, { backgroundColor: tone(cur), borderColor: t.line }]}>
        {prev && (
          <Text numberOfLines={1} style={[styles.prev, { color: t.mut }]}>
            {`${prev.minute}' ${prev.text}`}
          </Text>
        )}
        <View style={styles.now}>
          <View style={[styles.min, { backgroundColor: cur?.type === 'goal-for' ? t.good : cur?.type === 'goal-against' ? t.bad : comp }]}>
            <Text style={styles.minText}>{cur ? `${cur.minute}'` : '…'}</Text>
          </View>
          <Text style={[styles.lineText, { color: t.ink, fontFamily: cur?.type?.startsWith('goal') || cur?.type === 'decision' ? font.bold : font.medium }]}>
            {cur?.text ?? 'O narrador se prepara…'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 12, gap: 6 },
  board: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6, gap: 6 },
  side: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, minWidth: 0 },
  team: { flexShrink: 1, fontFamily: font.bold, fontSize: 13 },
  center: { alignItems: 'center', minWidth: 74 },
  score: { fontSize: 26, lineHeight: 28 },
  minute: { fontFamily: font.bold, fontSize: 11, letterSpacing: 0.8 },
  pitch: { borderRadius: 12, overflow: 'hidden', backgroundColor: '#2a7f45' },
  dot: { position: 'absolute', left: 0, top: 0 },
  ball: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#10261c',
    zIndex: 4,
  },
  skip: { position: 'absolute', right: 6, bottom: 4, backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  skipText: { color: '#fff', fontSize: 10, fontFamily: font.semibold },
  feed: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8, gap: 4, minHeight: 58, justifyContent: 'center' },
  prev: { fontSize: 12, fontFamily: font.regular },
  now: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  min: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, minWidth: 34, alignItems: 'center' },
  minText: { color: '#fff', fontFamily: font.bold, fontSize: 12 },
  lineText: { flex: 1, fontSize: 14, lineHeight: 19 },
});
