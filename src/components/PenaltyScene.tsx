import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, G, Line, LinearGradient as SvgGradient, Path, Polygon, Rect, Stop } from 'react-native-svg';

import type { PenaltyShot } from '@/api/types';
import { condensed, font, useTheme } from '@/theme';
import { Celebration } from './Celebration';
import { Btn, haptic } from './ui';

/*
 * Cena do pênalti vista de trás do batedor. Coordenadas num quadro de 360 x 300:
 * torcida em cima, placas, gol (x 70 a 290, travessão em y 100, linha em y 190),
 * gramado em perspectiva e a bola na marca do pênalti.
 */
const W = 360,
  H = 300;
const GOAL = { left: 70, right: 290, top: 100, bottom: 190 };
const SPOT = { x: 180, y: 262 };
const BALL = 30;
const KEEPER = { w: 66, h: 86, cx: 180, cy: 150 };

/** Centro de cada canto (0-2 em cima, 3-5 embaixo). */
const zoneRect = (i: number) => {
  const col = i % 3,
    row = i > 2 ? 1 : 0;
  const w = (GOAL.right - GOAL.left - 8) / 3,
    h = (GOAL.bottom - GOAL.top - 6) / 2;
  return { x: GOAL.left + 4 + col * w, y: GOAL.top + 4 + row * h, w, h };
};
const zoneCenter = (i: number) => {
  const r = zoneRect(i);
  return { x: r.x + r.w / 2, y: r.y + r.h / 2 };
};

/** Pontos da torcida (fixos, gerados uma vez). */
const CROWD = (() => {
  const colors = ['#f4c20d', '#ffffff', '#ff7a70', '#6cabdd', '#7be495', '#c8102e', '#1a3a8a'];
  let seed = 7;
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  return Array.from({ length: 150 }, () => ({ x: rnd() * W, y: 6 + rnd() * 56, r: 2 + rnd() * 2.4, c: colors[Math.floor(rnd() * colors.length)] }));
})();

/** Cenário fixo: torcida, placas, gramado, linhas e gol com rede. */
function Stadium({ netShake }: { netShake?: Animated.Value }) {
  // faixas do gramado: mais estreitas perto do gol, mais largas perto da bola (perspectiva)
  const bands: [number, number][] = [];
  let y = 84,
    h = 9;
  while (y < H) {
    bands.push([y, h]);
    y += h;
    h *= 1.18;
  }
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}>
        <Defs>
          <SvgGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#071a12" />
            <Stop offset="1" stopColor="#0f2d20" />
          </SvgGradient>
          <SvgGradient id="grassFade" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#000" stopOpacity={0.35} />
            <Stop offset="0.4" stopColor="#000" stopOpacity={0} />
          </SvgGradient>
        </Defs>
        {/* torcida */}
        <Rect x={0} y={0} width={W} height={70} fill="url(#sky)" />
        {CROWD.map((d, i) => (
          <Circle key={i} cx={d.x} cy={d.y} r={d.r} fill={d.c} opacity={0.55} />
        ))}
        {/* holofotes */}
        <Circle cx={30} cy={8} r={26} fill="#fff8d0" opacity={0.08} />
        <Circle cx={330} cy={8} r={26} fill="#fff8d0" opacity={0.08} />
        {/* placas de publicidade */}
        <Rect x={0} y={68} width={W} height={16} fill="#0d4a2e" />
        {Array.from({ length: 6 }, (_, i) => (
          <Rect key={i} x={i * 60 + 4} y={70} width={52} height={12} rx={2} fill={i % 2 ? '#f4c20d' : '#ffffff'} opacity={0.85} />
        ))}
        {/* gramado em perspectiva */}
        {bands.map(([by, bh], i) => (
          <Rect key={i} x={0} y={by} width={W} height={bh + 0.5} fill={i % 2 ? '#1a6b40' : '#1f7a4a'} />
        ))}
        <Rect x={0} y={84} width={W} height={H - 84} fill="url(#grassFade)" />
        {/* linha de fundo, pequena área e grande área */}
        <G stroke="rgba(255,255,255,0.75)" strokeWidth={2} fill="none">
          <Line x1={0} y1={GOAL.bottom} x2={W} y2={GOAL.bottom} />
          <Path d={`M${GOAL.left - 30} ${GOAL.bottom} L${GOAL.left - 46} 210 L${GOAL.right + 46} 210 L${GOAL.right + 30} ${GOAL.bottom}`} />
          <Path d={`M${GOAL.left - 90} ${GOAL.bottom} L${GOAL.left - 150} 284 M${GOAL.right + 90} ${GOAL.bottom} L${GOAL.right + 150} 284`} />
          <Path d="M120 284 Q180 300 240 284" />
        </G>
        <Circle cx={SPOT.x} cy={SPOT.y + 8} r={2.5} fill="#ffffff" />
        {/* sombra do gol */}
        <Polygon points={`${GOAL.left},${GOAL.bottom} ${GOAL.right},${GOAL.bottom} ${GOAL.right + 14},${GOAL.bottom + 8} ${GOAL.left - 14},${GOAL.bottom + 8}`} fill="#000" opacity={0.18} />
      </Svg>
      {/* rede (balança no gol) */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          netShake && {
            transform: [
              { scale: netShake.interpolate({ inputRange: [0, 0.3, 0.6, 1], outputRange: [1, 1.025, 0.99, 1] }) },
              { translateY: netShake.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, -2, 0] }) },
            ],
          },
        ]}
      >
        <Svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}>
          <Rect x={GOAL.left} y={GOAL.top} width={GOAL.right - GOAL.left} height={GOAL.bottom - GOAL.top} fill="#0b2419" opacity={0.35} />
          <G stroke="rgba(255,255,255,0.28)" strokeWidth={0.8}>
            {Array.from({ length: 23 }, (_, i) => (
              <Line key={'v' + i} x1={GOAL.left + i * 10} y1={GOAL.top} x2={GOAL.left + i * 10} y2={GOAL.bottom} />
            ))}
            {Array.from({ length: 10 }, (_, i) => (
              <Line key={'h' + i} x1={GOAL.left} y1={GOAL.top + i * 10} x2={GOAL.right} y2={GOAL.top + i * 10} />
            ))}
          </G>
        </Svg>
      </Animated.View>
      {/* traves por cima da rede */}
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}>
        <Path
          d={`M${GOAL.left} ${GOAL.bottom + 1} V${GOAL.top} H${GOAL.right} V${GOAL.bottom + 1}`}
          fill="none"
          stroke="#ffffff"
          strokeWidth={6}
          strokeLinejoin="round"
        />
        <Path d={`M${GOAL.left + 2} ${GOAL.top + 2} H${GOAL.right - 2}`} stroke="#c9d6cf" strokeWidth={1.5} />
      </Svg>
    </View>
  );
}

/** Goleiro desenhado em pé, com luvas. */
function KeeperFigure() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 66 86">
      {/* braços abertos */}
      <Path d="M18 30 L4 14 M48 30 L62 14" stroke="#ff7a70" strokeWidth={7} strokeLinecap="round" />
      <Circle cx={4} cy={12} r={5} fill="#ffffff" />
      <Circle cx={62} cy={12} r={5} fill="#ffffff" />
      {/* tronco */}
      <Path d="M17 26 Q33 20 49 26 L46 56 H20 Z" fill="#ff7a70" />
      <Path d="M28 30 H38 V40 H28 Z" fill="#10261c" opacity={0.6} />
      {/* cabeça */}
      <Circle cx={33} cy={14} r={9} fill="#e0b48a" />
      <Path d="M24 12 Q33 2 42 12" fill="#3b2a1a" />
      {/* calção e pernas */}
      <Rect x={20} y={54} width={26} height={10} rx={2} fill="#10261c" />
      <Path d="M25 64 L22 84 M41 64 L44 84" stroke="#ff7a70" strokeWidth={7} strokeLinecap="round" />
    </Svg>
  );
}

function BallFigure() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 30 30">
      <Circle cx={15} cy={15} r={13.5} fill="#ffffff" stroke="#10261c" strokeWidth={1.2} />
      <Path d="M15 8.5l5.6 4-2.1 6.5h-7l-2.1-6.5z" fill="#10261c" />
      <Path d="M15 8.5V2.5M20.6 12.5l5.4-2M18.5 19l3.5 5M11.5 19l-3.5 5M9.4 12.5L4 10.5" stroke="#10261c" strokeWidth={1} />
    </Svg>
  );
}

/** Quadro da cena que se ajusta à largura disponível. */
function useSceneSize() {
  const [width, setWidth] = useState(340);
  const k = width / W;
  return { width, height: H * k, k, onLayout: (w: number) => setWidth(Math.min(460, w)) };
}

// ------------------------------------------------------------------ mira + força

/** Escolha do canto e da força, antes da cobrança. */
export function PenaltyAim({
  zones,
  ideal,
  shotSkill,
  onShoot,
  disabled,
}: {
  zones: string[];
  ideal: { idealMin: number; idealMax: number };
  shotSkill: number | null;
  onShoot: (zone: number, power: number) => void;
  disabled?: boolean;
}) {
  const t = useTheme();
  const { width, height, k, onLayout } = useSceneSize();
  const [zone, setZone] = useState<number | null>(null);
  const [shot, setShot] = useState(false);
  const [power] = useState(() => new Animated.Value(0));
  const [pulse] = useState(() => new Animated.Value(0));
  const [sway] = useState(() => new Animated.Value(0));
  const [kick] = useState(() => new Animated.Value(0));
  const current = useRef(0);
  const loop = useRef<Animated.CompositeAnimation | null>(null);

  // goleiro balançando na linha
  useEffect(() => {
    const a = Animated.loop(
      Animated.sequence([
        Animated.timing(sway, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(sway, { toValue: -1, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    a.start();
    return () => a.stop();
  }, [sway]);

  // alvo pulsando e barra de força oscilando depois de escolher o canto
  useEffect(() => {
    if (zone == null) return;
    const id = power.addListener(({ value }) => (current.current = value));
    const p = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
    );
    loop.current = Animated.loop(
      Animated.sequence([
        Animated.timing(power, { toValue: 100, duration: 1100, easing: Easing.linear, useNativeDriver: false }),
        Animated.timing(power, { toValue: 0, duration: 1100, easing: Easing.linear, useNativeDriver: false }),
      ]),
    );
    p.start();
    loop.current.start();
    return () => {
      p.stop();
      loop.current?.stop();
      power.removeListener(id);
    };
  }, [zone, power, pulse]);

  const fire = () => {
    if (zone == null || shot || disabled) return;
    loop.current?.stop();
    const value = Math.round(current.current);
    setShot(true);
    haptic.success();
    // corrida curta da bola antes de enviar (o voo completo aparece no resultado)
    Animated.timing(kick, { toValue: 1, duration: 260, easing: Easing.out(Easing.quad), useNativeDriver: true }).start(() => onShoot(zone, value));
  };

  const c = zone != null ? zoneCenter(zone) : null;

  return (
    <View style={{ alignSelf: 'stretch' }} onLayout={(e) => onLayout(e.nativeEvent.layout.width)}>
      <View style={[styles.scene, { width, height, alignSelf: 'center' }]}>
        <Stadium />
        {/* goleiro */}
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: (KEEPER.cx - KEEPER.w / 2) * k,
            top: (KEEPER.cy - KEEPER.h / 2) * k,
            width: KEEPER.w * k,
            height: KEEPER.h * k,
            transform: [{ translateX: sway.interpolate({ inputRange: [-1, 1], outputRange: [-7 * k, 7 * k] }) }],
          }}
        >
          <KeeperFigure />
        </Animated.View>
        {/* alvo */}
        {c && (
          <Animated.View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: (c.x - 16) * k,
              top: (c.y - 16) * k,
              width: 32 * k,
              height: 32 * k,
              transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.15] }) }],
            }}
          >
            <Svg width="100%" height="100%" viewBox="0 0 32 32">
              <Circle cx={16} cy={16} r={13} stroke={t.acc} strokeWidth={3} fill="rgba(244,194,13,0.2)" />
              <Path d="M16 1v8M16 23v8M1 16h8M23 16h8" stroke={t.acc} strokeWidth={2.5} />
            </Svg>
          </Animated.View>
        )}
        {/* bola */}
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: (SPOT.x - BALL / 2) * k,
            top: (SPOT.y - BALL / 2) * k,
            width: BALL * k,
            height: BALL * k,
            transform: [
              { translateY: kick.interpolate({ inputRange: [0, 1], outputRange: [0, -18 * k] }) },
              { scale: kick.interpolate({ inputRange: [0, 1], outputRange: [1, 0.85] }) },
            ],
          }}
        >
          <BallFigure />
        </Animated.View>
        {/* áreas de toque dos cantos */}
        {zones.map((label, i) => {
          const r = zoneRect(i);
          return (
            <Pressable
              key={label}
              accessibilityRole="button"
              accessibilityLabel={'Mirar ' + label}
              disabled={shot || disabled}
              onPress={() => {
                haptic.tap();
                setZone(i);
              }}
              style={{
                position: 'absolute',
                left: r.x * k,
                top: r.y * k,
                width: r.w * k,
                height: r.h * k,
                borderWidth: zone === i ? 0 : 1,
                borderColor: 'rgba(244,194,13,0.45)',
                borderStyle: 'dashed',
              }}
            />
          );
        })}
      </View>

      {/* passo 1 e passo 2 */}
      {zone == null ? (
        <Text style={[styles.hint, { color: t.mut }]}>
          <Text style={{ color: t.acc, fontFamily: font.bold }}>1.</Text> Toque no canto onde quer bater · seu Chute: {shotSkill}
        </Text>
      ) : (
        <View style={{ marginTop: 12 }}>
          <Text style={[styles.hint, { color: t.mut }]}>
            <Text style={{ color: t.acc, fontFamily: font.bold }}>2.</Text> Mirando {zones[zone]}. Pare a barra na faixa verde.
          </Text>
          <View style={[styles.meter, { backgroundColor: t.cardHi, borderColor: t.lineStrong }]}>
            <View style={[styles.band, { left: '0%', width: `${ideal.idealMin}%`, backgroundColor: t.badSoft }]} />
            <View style={[styles.band, { left: `${ideal.idealMin}%`, width: `${ideal.idealMax - ideal.idealMin}%`, backgroundColor: t.goodSoft, borderColor: t.good, borderLeftWidth: 1, borderRightWidth: 1 }]} />
            <View style={[styles.band, { left: `${ideal.idealMax}%`, width: `${100 - ideal.idealMax}%`, backgroundColor: t.badSoft }]} />
            <Animated.View
              style={[
                styles.marker,
                { backgroundColor: t.ink, left: power.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }) },
              ]}
            />
          </View>
          <View style={styles.meterLabels}>
            <Text style={[styles.meterText, { color: t.mut }]}>fraco</Text>
            <Text style={[styles.meterText, { color: t.good }]}>ideal</Text>
            <Text style={[styles.meterText, { color: t.mut }]}>forte</Text>
          </View>
          <Btn primary label={shot ? 'Chutou!' : 'Chutar!  ⚽'} onPress={fire} busy={shot && disabled} disabled={shot} />
          {!shot && (
            <Text style={[styles.hint, { color: t.mut, fontSize: 12 }]}>
              Forte demais pode isolar a bola, principalmente nos cantos de cima.
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

// ------------------------------------------------------------------ replay da cobrança

const OUTCOME_TEXT: Record<PenaltyShot['outcome'], string> = {
  goal: 'GOOOL!',
  save: 'DEFENDEU!',
  post: 'NA TRAVE!',
  out: 'PRA FORA!',
};

/** Animação da cobrança: a bola voa e o goleiro mergulha. Chama `onDone` ao terminar. */
export function PenaltyReplay({ shot, onDone, still }: { shot: PenaltyShot; onDone?: () => void; still?: boolean }) {
  const t = useTheme();
  const { width, height, k, onLayout } = useSceneSize();
  // `still`: mostra direto o quadro final, sem animar de novo.
  const start = still ? 1 : 0;
  const [fly] = useState(() => new Animated.Value(start));
  const [dive] = useState(() => new Animated.Value(start));
  const [after] = useState(() => new Animated.Value(start));
  const [net] = useState(() => new Animated.Value(still ? 1 : 0));
  const [label] = useState(() => new Animated.Value(start));
  const [impact, setImpact] = useState(false);

  const target = zoneCenter(shot.zone);
  const col = shot.zone % 3;
  const high = shot.zone <= 2;
  // ponto onde a bola chega e para onde vai depois
  let end = target,
    rest = target;
  if (shot.outcome === 'post') {
    end = col === 0 ? { x: GOAL.left, y: target.y } : col === 2 ? { x: GOAL.right, y: target.y } : { x: target.x, y: GOAL.top };
    rest = { x: end.x + (col === 0 ? 30 : col === 2 ? -30 : 15), y: 236 };
  } else if (shot.outcome === 'out') {
    end = high ? { x: target.x + (col - 1) * 20, y: GOAL.top - 46 } : { x: col === 2 ? GOAL.right + 38 : GOAL.left - 38, y: target.y };
    rest = { x: end.x + (col - 1) * 30, y: end.y - 20 };
  } else if (shot.outcome === 'save') {
    rest = { x: target.x + (col - 1) * 8, y: GOAL.bottom + 16 };
  } else {
    rest = { x: target.x, y: target.y + 6 };
  }

  const kz = zoneCenter(shot.keeperZone);
  const kCol = shot.keeperZone % 3;
  const kHigh = shot.keeperZone <= 2;
  const diveX = kz.x - KEEPER.cx;
  const diveY = kCol === 1 ? (kHigh ? -26 : 14) : kz.y - KEEPER.cy + (kHigh ? -6 : 10);
  const diveRot = kCol === 0 ? '-72deg' : kCol === 2 ? '72deg' : '0deg';

  useEffect(() => {
    if (still) return;
    Animated.parallel([
      Animated.timing(fly, { toValue: 1, duration: 620, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(dive, { toValue: 1, duration: 480, delay: 120, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start(() => {
      setImpact(true);
      if (shot.outcome === 'goal') haptic.success();
      else haptic.fail();
      Animated.parallel([
        Animated.timing(after, { toValue: 1, duration: 420, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        shot.outcome === 'goal' ? Animated.timing(net, { toValue: 1, duration: 500, useNativeDriver: true }) : Animated.delay(0),
        Animated.spring(label, { toValue: 1, speed: 14, bounciness: 14, useNativeDriver: true }),
      ]).start(() => onDone?.());
    });
  }, [fly, dive, after, net, label, shot.outcome, onDone, still]);

  const mid = { x: (SPOT.x + end.x) / 2, y: Math.min(SPOT.y, end.y) - (high ? 40 : 18) };
  const color = shot.outcome === 'goal' ? t.good : t.bad;

  return (
    <View style={{ alignSelf: 'stretch' }} onLayout={(e) => onLayout(e.nativeEvent.layout.width)}>
      <View style={[styles.scene, { width, height, alignSelf: 'center' }]}>
        <Stadium netShake={net} />
        {/* goleiro mergulhando */}
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: (KEEPER.cx - KEEPER.w / 2) * k,
            top: (KEEPER.cy - KEEPER.h / 2) * k,
            width: KEEPER.w * k,
            height: KEEPER.h * k,
            transform: [
              { translateX: dive.interpolate({ inputRange: [0, 1], outputRange: [0, diveX * k] }) },
              { translateY: dive.interpolate({ inputRange: [0, 1], outputRange: [0, diveY * k] }) },
              { rotate: dive.interpolate({ inputRange: [0, 1], outputRange: ['0deg', diveRot] }) },
            ],
          }}
        >
          <KeeperFigure />
        </Animated.View>
        {/* bola: voa em arco, diminui com a distância e depois rebate ou morre na rede */}
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: (SPOT.x - BALL / 2) * k,
            top: (SPOT.y - BALL / 2) * k,
            width: BALL * k,
            height: BALL * k,
            opacity: shot.outcome === 'out' ? after.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) : 1,
            transform: [
              {
                translateX: Animated.add(
                  fly.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, (mid.x - SPOT.x) * k, (end.x - SPOT.x) * k] }),
                  after.interpolate({ inputRange: [0, 1], outputRange: [0, (rest.x - end.x) * k] }),
                ),
              },
              {
                translateY: Animated.add(
                  fly.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, (mid.y - SPOT.y) * k, (end.y - SPOT.y) * k] }),
                  after.interpolate({ inputRange: [0, 1], outputRange: [0, (rest.y - end.y) * k] }),
                ),
              },
              {
                scale: Animated.add(
                  fly.interpolate({ inputRange: [0, 1], outputRange: [1, 0.46] }),
                  after.interpolate({ inputRange: [0, 1], outputRange: [0, shot.outcome === 'post' || shot.outcome === 'save' ? 0.25 : 0] }),
                ),
              },
              { rotate: fly.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '900deg'] }) },
            ],
          }}
        >
          <BallFigure />
        </Animated.View>
        {/* fogos no gol */}
        {impact && shot.outcome === 'goal' && <Celebration kind="fogos" />}
        {/* placar do lance */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.outcome,
            {
              opacity: label,
              transform: [{ scale: label.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }, { rotate: '-4deg' }],
            },
          ]}
        >
          <Text style={[condensed, styles.outcomeText, { color, textShadowColor: '#000' }]}>{OUTCOME_TEXT[shot.outcome]}</Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scene: { borderRadius: 16, overflow: 'hidden', backgroundColor: '#0b2419' },
  hint: { fontFamily: font.medium, fontSize: 14, textAlign: 'center', marginTop: 10 },
  meter: { height: 30, borderRadius: 15, borderWidth: 1, overflow: 'hidden', marginTop: 10, justifyContent: 'center' },
  band: { position: 'absolute', top: 0, bottom: 0 },
  marker: { position: 'absolute', top: 2, bottom: 2, width: 6, marginLeft: -3, borderRadius: 3 },
  meterLabels: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 6, marginTop: 4 },
  meterText: { fontFamily: font.bold, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6 },
  outcome: { position: 'absolute', left: 0, right: 0, top: '3%', alignItems: 'center' },
  outcomeText: { fontSize: 46, lineHeight: 50, textShadowOffset: { width: 0, height: 3 }, textShadowRadius: 8 },
});
