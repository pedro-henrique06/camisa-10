import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Rect } from 'react-native-svg';

import type { MatchLine, MatchView } from '@/api/types';
import { Badge } from '@/components/art';
import { attackShare, createSim, lineAt, MY_SLOT, STEP_MS, stepSim, type P, type Sim } from '@/components/pitchSim';
import { haptic } from '@/components/ui';
import { alpha, compColor, condensed, font, useTheme } from '@/theme';

const RATIO = 0.62;
const DOT = 11;
const ME = 15;
const BALL = 8;

/** Distância entre duas cores #rrggbb (0 a ~441). */
function colorDistance(a: string, b: string) {
  const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) || 0);
  const [x, y] = [rgb(a), rgb(b)];
  return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]);
}

/** Cor dos adversários: a principal, ou a secundária quando é parecida com a nossa. */
function opponentColor(m: MatchView) {
  const same = colorDistance(m.opponentBadge.primary, m.teamBadge.primary) < 90;
  return same ? m.opponentBadge.secondary : m.opponentBadge.primary;
}

/**
 * Jogo ao vivo: placar, campo com as bolinhas correndo atrás da bola e a narração.
 * Toca as linhas uma a uma e chama `onDone` no fim (ou quando o jogador toca para pular).
 */
export function MatchPitch({
  match,
  onDone,
  meName,
  friend,
  hideBoard,
}: {
  match: MatchView;
  onDone?: () => void;
  /** Nome em cima da bolinha do jogador. */
  meName?: string;
  /** Duelo da Mesa: o amigo no time adversário (posição dele e nome em cima da bolinha). */
  friend?: { position: string; name: string };
  /** Sem o placar de cima (a tela já mostra um). */
  hideBoard?: boolean;
}) {
  const t = useTheme();
  const [width, setWidth] = useState(0);
  const [idx, setIdx] = useState(-1);
  const [done, setDone] = useState(false);
  const [dots] = useState(() => Array.from({ length: 22 }, () => new Animated.ValueXY({ x: -50, y: -50 })));
  const [ball] = useState(() => new Animated.ValueXY({ x: -50, y: -50 }));
  // barra de ataque: quanto do domínio é do time da casa (0 a 1)
  const [share] = useState(() => new Animated.Value(0.5));
  const shareNow = useRef(0.5);
  const sim = useRef<Sim | null>(null);
  const frame = useRef<number | null>(null);
  const lines = match.lines;
  const mySlot = MY_SLOT[match.position] ?? 6;
  const friendSlot = friend ? 11 + (MY_SLOT[friend.position] ?? 9) : -1;
  const height = width * RATIO;
  const total = lines.length * STEP_MS;

  /** Desenha a simulação: um único laço de animação move as 22 bolinhas e a bola. */
  const draw = (s: Sim) => {
    // o time da casa ataca para a direita, como no placar (quem joga fora vê o campo espelhado)
    const flip = !match.home;
    const px = (p: P, size: number) => ({
      x: (flip ? 1 - p.x : p.x) * width - size / 2,
      y: p.y * height - size / 2,
    });
    for (let k = 0; k < 22; k++) dots[k].setValue(px(s.pos[k], k === mySlot || k === friendSlot ? ME : DOT));
    ball.setValue(px(s.ball, BALL));
    // a barra anda devagar para o lado de quem ataca
    const mine = attackShare(s);
    const home = match.home ? mine : 1 - mine;
    shareNow.current += (home - shareNow.current) * 0.04;
    share.setValue(shareNow.current);
  };

  const stop = () => {
    if (frame.current != null) cancelAnimationFrame(frame.current);
    frame.current = null;
  };

  const finish = () => {
    stop();
    const s = sim.current ?? createSim(lines, match.focus, mySlot, friendSlot);
    sim.current = s;
    // pula para o fim: a simulação corre em segundos o que faltava, sem desenhar
    stepSim(s, total, lines, match.focus, mySlot);
    if (width) draw(s);
    setIdx(lines.length - 1);
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
        finish();
        return;
      }
      const s = createSim(lines, match.focus, mySlot, friendSlot);
      sim.current = s;
      draw(s);
      let started: number | null = null;
      let shown = -1;
      const loop = (ts: number) => {
        if (cancelled) return;
        started ??= ts;
        const now = Math.min(total, ts - started);
        stepSim(s, now, lines, match.focus, mySlot);
        draw(s);
        const li = lineAt(now, lines.length);
        if (li !== shown) {
          shown = li;
          setIdx(li);
          if (lines[li].type === 'goal-for') haptic.success();
          if (lines[li].type === 'goal-against') haptic.fail();
        }
        if (now >= total) {
          frame.current = null;
          setDone(true);
          onDone?.();
          return;
        }
        frame.current = requestAnimationFrame(loop);
      };
      frame.current = requestAnimationFrame(loop);
    })();
    return () => {
      cancelled = true;
      stop();
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
  const minute = cur ? cur.minute : (lines[0]?.minute ?? 0);
  const comp = compColor(t, match.kind);
  const myColor = match.teamBadge.primary;
  const oppColor = opponentColor(match);
  // o jogador em destaque não pode sumir no meio do time (ex.: camisa amarela do Brasil)
  const meColor = colorDistance(myColor, t.acc) < 120 ? '#ffffff' : t.acc;
  // o amigo do duelo: destaque próprio, diferente do jogador e do time dele
  const friendColor = colorDistance(oppColor, '#ff7ad9') < 120 ? '#7ae1ff' : '#ff7ad9';
  const [homeColor, awayColor] = match.home ? [myColor, oppColor] : [oppColor, myColor];
  const attacking = !cur
    ? null
    : cur.type === 'goal-for' || cur.type === 'chance-for' || cur.type === 'attack-for'
      ? 'mine'
      : cur.type === 'goal-against' || cur.type === 'chance-against' || cur.type === 'attack-against'
        ? 'opp'
        : null;
  const attackName = attacking === 'mine' ? match.team : attacking === 'opp' ? match.opponent : null;
  const attackHome = attacking == null ? null : (attacking === 'mine') === match.home;
  // véu sobre as cores dos times, para a narração ficar legível (verde no gol a favor, vermelho no contra)
  const tone = (l: MatchLine | null) =>
    !l
      ? 'rgba(8,20,14,0.42)'
      : l.type === 'goal-for'
        ? alpha('#1f7a3d', 0.78)
        : l.type === 'goal-against'
          ? alpha('#8a1f1f', 0.78)
          : l.type === 'decision'
            ? alpha('#6b5200', 0.75)
            : 'rgba(8,20,14,0.42)';

  return (
    <View style={styles.wrap}>
      {!hideBoard && (
        <View style={[styles.board, { backgroundColor: t.cardHi, borderColor: alpha(comp, 0.5) }]}>
          <View style={styles.side}>
            <Badge badge={hb} size={24} />
            <Text numberOfLines={1} style={[styles.team, { color: t.ink }]}>
              {hn}
            </Text>
          </View>
          <View style={styles.center}>
            <Text style={[condensed, styles.score, { color: t.ink }]}>
              {hs} <Text style={{ color: t.mut }}>x</Text> {as}
            </Text>
            <Text style={[styles.minute, { color: match.final && done ? t.mut : t.bad }]}>{match.final && done ? 'FIM' : `${minute}'`}</Text>
          </View>
          <View style={[styles.side, { justifyContent: 'flex-end' }]}>
            <Text numberOfLines={1} style={[styles.team, { color: t.ink, textAlign: 'right' }]}>
              {an}
            </Text>
            <Badge badge={ab} size={24} />
          </View>
        </View>
      )}

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
              const pal = k === friendSlot;
              const mineTeam = k < 11;
              const size = me || pal ? ME : DOT;
              return (
                <Animated.View
                  key={k}
                  testID={`pitch-dot-${k}`}
                  style={[
                    styles.dot,
                    {
                      width: size,
                      height: size,
                      borderRadius: size / 2,
                      backgroundColor: me ? meColor : pal ? friendColor : mineTeam ? myColor : oppColor,
                      borderColor: me || pal ? '#10261c' : 'rgba(255,255,255,0.85)',
                      borderWidth: me || pal ? 2 : 1.2,
                      zIndex: me || pal ? 3 : 1,
                      transform: v.getTranslateTransform(),
                    },
                  ]}
                />
              );
            })}
            <Animated.View testID="pitch-ball" style={[styles.ball, { transform: ball.getTranslateTransform() }]} />
            {/* nomes em cima do jogador e do amigo */}
            {[
              { k: mySlot, name: meName, color: meColor },
              { k: friendSlot, name: friend?.name, color: friendColor },
            ]
              .filter((x) => x.k >= 0 && x.name)
              .map((x) => (
                <Animated.View key={`tag-${x.k}`} pointerEvents="none" style={[styles.tag, { transform: dots[x.k].getTranslateTransform() }]}>
                  <View
                    style={[
                      styles.tagInner,
                      {
                        backgroundColor: 'rgba(0,0,0,0.55)',
                        borderColor: x.color,
                      },
                    ]}
                  >
                    <Text numberOfLines={1} style={styles.tagText}>
                      {x.name}
                    </Text>
                  </View>
                </Animated.View>
              ))}
            {!done && (
              <View style={styles.skip}>
                <Text style={styles.skipText}>Toque para pular ›</Text>
              </View>
            )}
          </>
        )}
      </Pressable>

      {/* barra de ataque: pende para o lado de quem ataca, com a narração dentro */}
      <View testID="attack-bar" style={[styles.bar, { borderColor: alpha(comp, 0.45) }]}>
        <Animated.View
          style={[
            styles.barFill,
            {
              left: 0,
              backgroundColor: homeColor,
              width: share.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
        <Animated.View
          style={[
            styles.barFill,
            {
              right: 0,
              backgroundColor: awayColor,
              width: share.interpolate({
                inputRange: [0, 1],
                outputRange: ['100%', '0%'],
              }),
            },
          ]}
        />
        <View style={[styles.barShade, { backgroundColor: tone(cur) }]} />
        <View style={styles.barRow}>
          <Text numberOfLines={1} style={[styles.arrow, { opacity: attackHome === true ? 1 : 0.2 }]}>
            {attackHome === true ? '▶▶' : '▶'}
          </Text>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.barLabel}>
              {cur ? `${cur.minute}'` : '…'}
              {attackName ? ` · ATAQUE ${attackName.toUpperCase()}` : cur?.type === 'decision' ? ' · SUA JOGADA' : cur?.type === 'whistle' ? ' · APITO' : ''}
            </Text>
            <Text
              style={[
                styles.barText,
                {
                  fontFamily: cur?.type?.startsWith('goal') || cur?.type === 'decision' ? font.bold : font.semibold,
                },
              ]}
            >
              {cur?.text ?? 'O narrador se prepara…'}
            </Text>
          </View>
          <Text numberOfLines={1} style={[styles.arrow, { opacity: attackHome === false ? 1 : 0.2 }]}>
            {attackHome === false ? '◀◀' : '◀'}
          </Text>
        </View>
      </View>
      {prev && (
        <Text numberOfLines={1} style={[styles.prev, { color: t.mut }]}>
          {`${prev.minute}' ${prev.text}`}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 12, gap: 6 },
  board: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
  },
  side: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
  },
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
  skip: {
    position: 'absolute',
    right: 6,
    bottom: 4,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  skipText: { color: '#fff', fontSize: 10, fontFamily: font.semibold },
  prev: { fontSize: 12, fontFamily: font.regular, paddingHorizontal: 4 },
  bar: {
    borderWidth: 1,
    borderRadius: 14,
    overflow: 'hidden',
    minHeight: 64,
    justifyContent: 'center',
  },
  barFill: { position: 'absolute', top: 0, bottom: 0 },
  barShade: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  arrow: {
    color: '#fff',
    fontFamily: font.bold,
    fontSize: 11,
    width: 30,
    textAlign: 'center',
    letterSpacing: -2,
  },
  barLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontFamily: font.bold,
    fontSize: 10,
    letterSpacing: 0.8,
  },
  barText: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 19,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowRadius: 2,
  },
  // o nome fica centrado em cima da bolinha (que tem ME de largura)
  tag: {
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 5,
    width: 80,
    marginLeft: -(80 - ME) / 2,
    marginTop: -18,
    alignItems: 'center',
  },
  tagInner: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 1,
    maxWidth: 80,
  },
  tagText: {
    color: '#fff',
    fontFamily: font.bold,
    fontSize: 9,
    textAlign: 'center',
  },
});
