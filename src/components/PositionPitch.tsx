import { useEffect, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, G, Line, LinearGradient as SvgGradient, Path, Polygon, Rect, Stop, Text as SvgText } from 'react-native-svg';

import type { PositionOption } from '@/api/types';
import { condensed, font, useTheme } from '@/theme';
import { Bar, FadeIn, haptic } from './ui';

/*
 * Campo visto de cima, atacando para cima. Quadro de 200 x 290.
 */
const W = 200,
  H = 290;

/** Onde cada posição fica no campo (algumas aparecem dos dois lados). */
const SPOTS: Record<string, [number, number][]> = {
  Atacante: [[100, 54]],
  Ponta: [[38, 90], [162, 90]],
  Meia: [[100, 130]],
  Volante: [[100, 172]],
  Lateral: [[30, 198], [170, 198]],
  Zagueiro: [[72, 234], [128, 234]],
};

const SHORT: Record<string, string> = { Atacante: 'ATA', Ponta: 'PON', Meia: 'MEI', Volante: 'VOL', Lateral: 'LAT', Zagueiro: 'ZAG' };

/** Camisa centrada em (0, 0). */
const SHIRT = 'M-7 -11 L-13 -8 L-17 -1 L-11 2 L-9.5 -2 V12 H9.5 V-2 L11 2 L17 -1 L13 -8 L7 -11 Q0 -6 -7 -11 Z';

function Markings() {
  const line = 'rgba(255,255,255,0.7)';
  return (
    <>
      <Defs>
        <SvgGradient id="pp-grass" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#23854f" />
          <Stop offset="1" stopColor="#15603a" />
        </SvgGradient>
        <SvgGradient id="pp-light" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#ffffff" stopOpacity={0.14} />
          <Stop offset="0.5" stopColor="#ffffff" stopOpacity={0} />
        </SvgGradient>
      </Defs>
      <Rect x={0} y={0} width={W} height={H} rx={12} fill="url(#pp-grass)" />
      {/* faixas do gramado cortado */}
      {Array.from({ length: 10 }, (_, i) => (
        <Rect key={i} x={8} y={8 + i * 27.4} width={184} height={13.7} fill="#ffffff" fillOpacity={0.045} />
      ))}
      <Rect x={0} y={0} width={W} height={H} rx={12} fill="url(#pp-light)" />
      <G stroke={line} strokeWidth={1.4} fill="none">
        <Rect x={8} y={8} width={184} height={274} />
        <Line x1={8} y1={145} x2={192} y2={145} />
        <Circle cx={100} cy={145} r={24} />
        {/* área de cima */}
        <Rect x={46} y={8} width={108} height={42} />
        <Rect x={76} y={8} width={48} height={15} />
        <Path d="M84 50 A20 20 0 0 0 116 50" />
        {/* área de baixo */}
        <Rect x={46} y={240} width={108} height={42} />
        <Rect x={76} y={267} width={48} height={15} />
        <Path d="M84 240 A20 20 0 0 1 116 240" />
        {/* escanteios */}
        <Path d="M8 13 A5 5 0 0 0 13 8 M187 8 A5 5 0 0 0 192 13 M8 277 A5 5 0 0 1 13 282 M187 282 A5 5 0 0 1 192 277" />
      </G>
      <Circle cx={100} cy={145} r={1.8} fill={line} />
      <Circle cx={100} cy={37} r={1.6} fill={line} />
      <Circle cx={100} cy={253} r={1.6} fill={line} />
      {/* gols com rede */}
      {[
        [86, 1.5],
        [86, 282],
      ].map(([x, y], i) => (
        <G key={i}>
          <Rect x={x} y={y} width={28} height={6.5} fill="rgba(255,255,255,0.18)" stroke="#ffffff" strokeWidth={1.4} />
          {Array.from({ length: 6 }, (_, j) => (
            <Line key={j} x1={x + 4 * (j + 1)} y1={y} x2={x + 4 * (j + 1)} y2={y + 6.5} stroke="rgba(255,255,255,0.35)" strokeWidth={0.5} />
          ))}
        </G>
      ))}
    </>
  );
}

/** Seta da posição atual para a sugerida (mudança de posição). */
function SwapArrow({ from, to }: { from: [number, number]; to: [number, number] }) {
  const t = useTheme();
  const dx = to[0] - from[0],
    dy = to[1] - from[1];
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len,
    uy = dy / len;
  const sx = from[0] + ux * 18,
    sy = from[1] + uy * 18;
  const ex = to[0] - ux * 20,
    ey = to[1] - uy * 20;
  const px = -uy * 5,
    py = ux * 5;
  return (
    <G>
      <Line x1={sx} y1={sy} x2={ex} y2={ey} stroke={t.acc} strokeWidth={2.5} strokeDasharray="5 4" strokeLinecap="round" />
      <Polygon points={`${ex + ux * 7},${ey + uy * 7} ${ex + px},${ey + py} ${ex - px},${ey - py}`} fill={t.acc} />
    </G>
  );
}

type Props = {
  selected?: string | null;
  /** Posição atual (tracejada), na sugestão de mudança. */
  current?: string | null;
  onPick?: (p: string) => void;
  /** Dados das posições para a ficha abaixo do campo. */
  info?: PositionOption[];
  width?: number;
};

/** Campo para escolher (ou mostrar) a posição, com ficha da posição selecionada. */
export function PositionPitch({ selected, current, onPick, info, width = 270 }: Props) {
  const t = useTheme();
  const k = width / W;
  const [pulse] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const a = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1100, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    a.start();
    return () => a.stop();
  }, [pulse]);

  // seta da mudança: liga os pontos mais próximos das duas posições
  let arrow: { from: [number, number]; to: [number, number] } | null = null;
  if (current && selected && current !== selected) {
    let best = Infinity;
    for (const a of SPOTS[current] ?? [])
      for (const b of SPOTS[selected] ?? []) {
        const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
        if (d < best) {
          best = d;
          arrow = { from: a, to: b };
        }
      }
  }

  const sel = info?.find((p) => p.name === selected);

  return (
    <View style={{ alignItems: 'center', marginVertical: 10 }}>
      <View style={[styles.frame, { width, height: H * k, shadowColor: '#000' }]}>
        <Svg width={width} height={H * k} viewBox={`0 0 ${W} ${H}`}>
          <Markings />
          {arrow && <SwapArrow from={arrow.from} to={arrow.to} />}
          {Object.entries(SPOTS).flatMap(([pos, spots]) =>
            spots.map(([x, y], i) => {
              const on = pos === selected;
              const cur = pos === current && !on;
              const dim = !!selected && !on && !cur;
              return (
                <G key={pos + i} opacity={dim ? 0.7 : 1}>
                  {/* sombra */}
                  <Circle cx={x} cy={y + 13} r={9} fill="#000" opacity={0.18} />
                  <G transform={`translate(${x} ${y}) scale(${on ? 1.18 : 1})`}>
                    <Path
                      d={SHIRT}
                      fill={on ? t.acc : cur ? 'rgba(11,36,25,0.85)' : '#f4f2ea'}
                      stroke={on ? '#b8890a' : cur ? t.acc : 'rgba(11,36,25,0.5)'}
                      strokeWidth={1.4}
                      strokeDasharray={cur ? '3 2' : undefined}
                      strokeLinejoin="round"
                    />
                    <SvgText x={0} y={5} textAnchor="middle" fontSize={7} fontFamily={font.display} fill={on ? '#10261c' : cur ? t.acc : '#10261c'}>
                      {SHORT[pos]}
                    </SvgText>
                  </G>
                </G>
              );
            }),
          )}
        </Svg>

        {/* anel pulsando na posição escolhida */}
        {selected &&
          (SPOTS[selected] ?? []).map(([x, y], i) => (
            <Animated.View
              key={i}
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: (x - 22) * k,
                top: (y - 22) * k,
                width: 44 * k,
                height: 44 * k,
                borderRadius: 22 * k,
                borderWidth: 2,
                borderColor: t.acc,
                opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.9, 0] }),
                transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.25] }) }],
              }}
            />
          ))}

        {/* áreas de toque (maiores que a camisa) */}
        {onPick &&
          Object.entries(SPOTS).flatMap(([pos, spots]) =>
            spots.map(([x, y], i) => (
              <Pressable
                key={pos + i}
                accessibilityRole="button"
                accessibilityLabel={pos}
                accessibilityState={{ selected: pos === selected }}
                onPress={() => {
                  haptic.tap();
                  onPick(pos);
                }}
                style={{ position: 'absolute', left: (x - 24) * k, top: (y - 24) * k, width: 48 * k, height: 48 * k, borderRadius: 24 * k }}
              />
            )),
          )}
      </View>

      {info && (
        <View style={{ alignSelf: 'stretch', marginTop: 14 }}>
          {sel ? (
            <FadeIn key={sel.name}>
              <View style={[styles.card, { backgroundColor: t.cardHi, borderColor: t.accSoft }]}>
                <View style={styles.cardHead}>
                  <Text style={[condensed, { color: t.ink, fontSize: 26 }]}>{sel.name}</Text>
                  <View style={[styles.pill, { backgroundColor: t.acc }]}>
                    <Text style={{ color: t.accText, fontFamily: font.display, fontSize: 13 }}>{sel.short}</Text>
                  </View>
                </View>
                <Text style={{ color: t.mut, fontFamily: font.regular, fontSize: 15, lineHeight: 21, marginBottom: 10 }}>{sel.description}</Text>
                <Text style={[styles.label, { color: t.mut }]}>O QUE MAIS PESA NO SEU OVERALL</Text>
                {sel.weights.slice(0, 4).map((w) => (
                  <View key={w.key} style={styles.weight}>
                    <Text style={{ color: t.ink, fontFamily: font.semibold, width: 64 }}>{w.name}</Text>
                    <View style={{ flex: 1 }}>
                      <Bar value={w.percent * 2} height={7} />
                    </View>
                    <Text style={{ color: t.acc, fontFamily: font.bold, width: 40, textAlign: 'right' }}>{w.percent}%</Text>
                  </View>
                ))}
              </View>
            </FadeIn>
          ) : (
            <View style={[styles.card, { backgroundColor: t.cardHi, borderColor: t.line, borderStyle: 'dashed' }]}>
              <Text style={{ color: t.mut, fontFamily: font.medium, textAlign: 'center' }}>
                👆 Toque numa camisa para ver o que a posição faz e quais atributos contam mais.
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { borderRadius: 14, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.35, shadowRadius: 18, elevation: 8 },
  card: { borderWidth: 1, borderRadius: 16, padding: 14 },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  pill: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  label: { fontFamily: font.bold, fontSize: 11, letterSpacing: 1.1, marginBottom: 6 },
  weight: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 3 },
});
