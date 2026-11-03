import { useEffect, useState } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient as SvgGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';

import type { Badge as BadgeT } from '@/api/types';
import { font, useTheme } from '@/theme';

/** Escudo do clube com brilho. */
export function Badge({ badge, size = 36 }: { badge: BadgeT; size?: number }) {
  const id = 'b' + badge.primary.replace('#', '') + badge.secondary.replace('#', '');
  return (
    <Svg width={size} height={size * 1.1} viewBox="0 0 40 44">
      <Defs>
        <SvgGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#ffffff" stopOpacity={0.35} />
          <Stop offset="0.5" stopColor="#ffffff" stopOpacity={0} />
        </SvgGradient>
      </Defs>
      <Path d="M4 4h32v18c0 9-7 14-16 18C11 36 4 31 4 22z" fill={badge.primary} stroke={badge.secondary} strokeWidth={2} />
      <Path d="M4 4h32v18c0 9-7 14-16 18C11 36 4 31 4 22z" fill={`url(#${id})`} />
      <SvgText x={20} y={26} textAnchor="middle" fontSize={13} fontFamily={font.display} fill={badge.secondary}>
        {badge.initials}
      </SvgText>
    </Svg>
  );
}

/** Anel do overall: o preenchimento mostra o valor de 0 a 99. */
export function OvrRing({ value, size = 76 }: { value: number; size?: number }) {
  const t = useTheme();
  const r = 32,
    c = 2 * Math.PI * r;
  const [a] = useState(() => new Animated.Value(value));
  const [shown, setShown] = useState(value);
  useEffect(() => {
    const id = a.addListener(({ value: v }) => setShown(Math.round(v)));
    Animated.timing(a, { toValue: value, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
    return () => a.removeListener(id);
  }, [a, value]);
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 76 76">
        <Circle cx={38} cy={38} r={r} stroke={t.line} strokeWidth={6} fill="none" />
        <Circle
          cx={38}
          cy={38}
          r={r}
          stroke={t.acc}
          strokeWidth={6}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${(c * shown) / 99} ${c}`}
          transform="rotate(-90 38 38)"
        />
        <SvgText x={38} y={44} textAnchor="middle" fontSize={26} fontFamily={font.display} fill={t.ink}>
          {String(shown)}
        </SvgText>
        <SvgText x={38} y={57} textAnchor="middle" fontSize={8} fontFamily={font.bold} fill={t.mut} letterSpacing={1}>
          OVR
        </SvgText>
      </Svg>
    </View>
  );
}

/** Camisa 10 da tela inicial, flutuando de leve. */
export function Jersey({ size = 150 }: { size?: number }) {
  const t = useTheme();
  const [a] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(a, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(a, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [a]);
  return (
    <Animated.View
      style={{
        transform: [
          { translateY: a.interpolate({ inputRange: [0, 1], outputRange: [0, -8] }) },
          { rotate: a.interpolate({ inputRange: [0, 1], outputRange: ['-4deg', '2deg'] }) },
        ],
      }}
    >
      <Svg width={size} height={size} viewBox="0 0 120 120">
        <Defs>
          <SvgGradient id="jg" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={t.accHi} />
            <Stop offset="1" stopColor={t.acc} />
          </SvgGradient>
        </Defs>
        <Path
          d="M40 12l-26 14 10 22 10-5v63h52V43l10 5 10-22-26-14c-3 8-11 13-20 13s-17-5-20-13z"
          fill="url(#jg)"
          stroke="#b8890a"
          strokeWidth={2.5}
          strokeLinejoin="round"
        />
        <Path d="M40 12c3 8 11 13 20 13s17-5 20-13" fill="none" stroke="#0d6b3f" strokeWidth={4} />
        <SvgText x={60} y={88} textAnchor="middle" fontSize={44} fontFamily={font.display} fill="#0d4a2e">
          10
        </SvgText>
      </Svg>
    </Animated.View>
  );
}

/** Entrada com giro e "pulo". */
function Pop({ children }: { children: React.ReactNode }) {
  const [a] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.timing(a, { toValue: 1, duration: 1000, easing: Easing.out(Easing.back(2)), useNativeDriver: true }).start();
  }, [a]);
  return (
    <Animated.View
      style={{
        alignItems: 'center',
        marginVertical: 6,
        opacity: a.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 1] }),
        transform: [
          { translateY: a.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) },
          { scale: a.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) },
          { rotate: a.interpolate({ inputRange: [0, 1], outputRange: ['-12deg', '0deg'] }) },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
}

const CONFETTI = ['#f4c20d', '#ff7a70', '#7be495', '#6cabdd', '#ffffff'];

export function Confetti() {
  const [pieces] = useState(() =>
    Array.from({ length: 30 }, (_, i) => ({
      left: 2 + Math.random() * 94,
      delay: Math.random() * 900,
      color: CONFETTI[i % 5],
      v: new Animated.Value(0),
    })),
  );
  useEffect(() => {
    pieces.forEach((p) =>
      Animated.timing(p.v, { toValue: 1, duration: 2400, delay: p.delay, easing: Easing.in(Easing.quad), useNativeDriver: true }).start(),
    );
  }, [pieces]);
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 0, zIndex: 5 }}>
      {pieces.map((p, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            top: -6,
            left: `${p.left}%`,
            width: 7,
            height: 12,
            borderRadius: 2,
            backgroundColor: p.color,
            opacity: p.v.interpolate({ inputRange: [0, 0.01, 1], outputRange: [0, 1, 0] }),
            transform: [
              { translateY: p.v.interpolate({ inputRange: [0, 1], outputRange: [0, 220] }) },
              { rotate: p.v.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '540deg'] }) },
            ],
          }}
        />
      ))}
    </View>
  );
}

export function Trophy() {
  return (
    <View style={{ position: 'relative' }}>
      <Confetti />
      <Pop>
        <Svg viewBox="0 0 64 66" width={86} height={90}>
          <Path d="M16 6h32v18c0 10-7 17-16 17S16 34 16 24z" fill="#f4c20d" stroke="#b8890a" strokeWidth={2} />
          <Path d="M16 10H6c0 12 4 18 12 19M48 10h10c0 12-4 18-12 19" fill="none" stroke="#f4c20d" strokeWidth={4} />
          <Rect x={28} y={41} width={8} height={12} fill="#f4c20d" />
          <Rect x={18} y={53} width={28} height={7} rx={2} fill="#b8890a" />
          <Path d="M32 14l2.5 5 5.5.8-4 3.9 1 5.5-5-2.7-5 2.7 1-5.5-4-3.9 5.5-.8z" fill="#fff8d0" />
        </Svg>
      </Pop>
    </View>
  );
}

/** Bola de Ouro. */
export function GoldenBall() {
  return (
    <View style={{ position: 'relative' }}>
      <Confetti />
      <Pop>
        <Svg viewBox="0 0 64 64" width={86} height={86}>
          <Circle cx={32} cy={30} r={24} fill="#f4c20d" stroke="#b8890a" strokeWidth={2} />
          <Path d="M32 18l8 6-3 9H27l-3-9zM24 24l-10 3M40 24l10 3M27 33l-4 10M37 33l4 10" fill="none" stroke="#b8890a" strokeWidth={2} />
          <Rect x={24} y={54} width={16} height={6} rx={2} fill="#b8890a" />
        </Svg>
      </Pop>
    </View>
  );
}

/** Braçadeira de capitão. */
export function Armband() {
  const [a] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.timing(a, { toValue: 1, duration: 900, easing: Easing.out(Easing.back(2)), useNativeDriver: true }).start();
  }, [a]);
  return (
    <Animated.View
      style={{
        alignItems: 'center',
        marginVertical: 8,
        opacity: a,
        transform: [
          { translateX: a.interpolate({ inputRange: [0, 1], outputRange: [-70, 0] }) },
          { scale: a.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) },
        ],
      }}
    >
      <Svg viewBox="0 0 120 60" width={150} height={75}>
        <Path d="M10 14c20-10 80-10 100 0v32c-20 10-80 10-100 0z" fill="#f4c20d" stroke="#b8890a" strokeWidth={3} />
        <SvgText x={60} y={44} textAnchor="middle" fontSize={34} fontFamily={font.display} fill="#10261c">
          C
        </SvgText>
      </Svg>
    </Animated.View>
  );
}

const SPOTS: Record<string, [number, number][]> = {
  Atacante: [[100, 45]],
  Ponta: [[35, 85], [165, 85]],
  Meia: [[100, 120]],
  Volante: [[100, 165]],
  Lateral: [[30, 185], [170, 185]],
  Zagueiro: [[75, 220], [125, 220]],
};
const SHORT: Record<string, string> = { Atacante: 'ATA', Ponta: 'PON', Meia: 'MEI', Volante: 'VOL', Lateral: 'LAT', Zagueiro: 'ZAG' };

/** Campo com as posições. */
export function Pitch({ selected, current, onPick, width = 240 }: { selected?: string | null; current?: string | null; onPick?: (p: string) => void; width?: number }) {
  const t = useTheme();
  const lines = 'rgba(255,255,255,0.55)';
  return (
    <View style={{ alignItems: 'center', marginVertical: 12 }}>
      <Svg viewBox="0 0 200 262" width={width} height={(width * 262) / 200}>
        <Defs>
          <SvgGradient id="grass" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#1f7a4a" />
            <Stop offset="1" stopColor="#145c37" />
          </SvgGradient>
        </Defs>
        <Rect x={4} y={4} width={192} height={254} rx={8} fill="url(#grass)" />
        {Array.from({ length: 8 }, (_, i) => (
          <Rect key={i} x={4} y={4 + i * 31.75} width={192} height={15.9} fill="#ffffff" fillOpacity={0.04} />
        ))}
        <G fill="none" stroke={lines} strokeWidth={1.5}>
          <Rect x={4} y={4} width={192} height={254} rx={8} />
          <Path d="M4 131h192" />
          <Circle cx={100} cy={131} r={25} />
          <Rect x={55} y={4} width={90} height={40} />
          <Rect x={55} y={218} width={90} height={40} />
        </G>
        {Object.entries(SPOTS).flatMap(([pos, spots]) =>
          spots.map(([x, y], i) => {
            const on = pos === selected;
            const cur = pos === current && !on;
            return (
              <G key={pos + i} onPress={onPick ? () => onPick(pos) : undefined}>
                {onPick && <Circle cx={x} cy={y} r={20} fill="transparent" />}
                <Circle cx={x} cy={y} r={on ? 14 : 12} fill={on ? t.acc : 'rgba(11,36,25,0.55)'} stroke={on || cur ? t.acc : '#ffffff'} strokeWidth={2} strokeDasharray={cur ? '4' : undefined} />
                <SvgText x={x} y={y + 4} textAnchor="middle" fontSize={9} fontFamily={font.bold} fill={on ? '#10261c' : '#ffffff'}>
                  {SHORT[pos]}
                </SvgText>
              </G>
            );
          }),
        )}
      </Svg>
    </View>
  );
}

/** Dado de 20 lados que gira ao aparecer. */
export function D20({ value }: { value: number }) {
  const t = useTheme();
  const [a] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.timing(a, { toValue: 1, duration: 800, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [a]);
  return (
    <Animated.View
      style={{
        width: 52,
        height: 52,
        opacity: a,
        transform: [
          { rotate: a.interpolate({ inputRange: [0, 1], outputRange: ['-540deg', '0deg'] }) },
          { scale: a.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.4, 1.15, 1] }) },
        ],
      }}
    >
      <Svg width={52} height={52} viewBox="0 0 46 46">
        <Path d="M23 0L46 11.5V34.5L23 46L0 34.5V11.5z" fill={t.acc} />
        <Path d="M23 0L46 11.5L23 18L0 11.5z" fill="#ffffff" fillOpacity={0.25} />
        <SvgText x={23} y={31} textAnchor="middle" fontSize={22} fontFamily={font.display} fill={t.accText}>
          {String(value)}
        </SvgText>
      </Svg>
    </Animated.View>
  );
}
