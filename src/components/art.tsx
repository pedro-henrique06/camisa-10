import { useEffect, useState } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, { Circle, G, Path, Rect, Text as SvgText } from 'react-native-svg';

import type { Badge as BadgeT } from '@/api/types';
import { useTheme } from '@/theme';

/** Escudo do clube (badge). */
export function Badge({ badge, size = 36 }: { badge: BadgeT; size?: number }) {
  return (
    <Svg width={size} height={size * 1.1} viewBox="0 0 40 44">
      <Path d="M4 4h32v18c0 9-7 14-16 18C11 36 4 31 4 22z" fill={badge.primary} stroke={badge.secondary} strokeWidth={2} />
      <SvgText x={20} y={26} textAnchor="middle" fontSize={13} fontWeight="800" fill={badge.secondary}>
        {badge.initials}
      </SvgText>
    </Svg>
  );
}

/** Entrada com giro e "pulo" (animação .tw do original). */
function Pop({ children }: { children: React.ReactNode }) {
  const a = useState(() => new Animated.Value(0))[0];
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

function Confetti() {
  const [pieces] = useState(() =>
    Array.from({ length: 26 }, (_, i) => ({
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
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 0 }}>
      {pieces.map((p, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            top: -6,
            left: `${p.left}%`,
            width: 7,
            height: 12,
            backgroundColor: p.color,
            opacity: p.v.interpolate({ inputRange: [0, 0.01, 1], outputRange: [0, 1, 0] }),
            transform: [
              { translateY: p.v.interpolate({ inputRange: [0, 1], outputRange: [0, 200] }) },
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
        <Svg viewBox="0 0 64 66" width={76} height={80}>
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
    <Pop>
      <Svg viewBox="0 0 64 64" width={76} height={76}>
        <Circle cx={32} cy={30} r={24} fill="#f4c20d" stroke="#b8890a" strokeWidth={2} />
        <Path d="M32 18l8 6-3 9H27l-3-9zM24 24l-10 3M40 24l10 3M27 33l-4 10M37 33l4 10" fill="none" stroke="#b8890a" strokeWidth={2} />
        <Rect x={24} y={54} width={16} height={6} rx={2} fill="#b8890a" />
      </Svg>
    </Pop>
  );
}

/** Braçadeira de capitão. */
export function Armband() {
  const a = useState(() => new Animated.Value(0))[0];
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
        <SvgText x={60} y={42} textAnchor="middle" fontSize={34} fontWeight="800" fill="#10261c">
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

/** Campo com as posições (pitch). */
export function Pitch({ selected, current, onPick }: { selected?: string | null; current?: string | null; onPick?: (p: string) => void }) {
  const t = useTheme();
  return (
    <View style={{ alignItems: 'center', marginVertical: 12 }}>
      <Svg viewBox="0 0 200 262" width={240} height={314}>
        <G fill="none" stroke={t.line} strokeWidth={2}>
          <Rect x={4} y={4} width={192} height={254} />
          <Path d="M4 131h192" />
          <Circle cx={100} cy={131} r={25} />
          <Rect x={55} y={4} width={90} height={40} />
          <Rect x={55} y={218} width={90} height={40} />
        </G>
        {Object.entries(SPOTS).flatMap(([pos, spots]) =>
          spots.map(([x, y], i) => (
            <G key={pos + i}>
              <Circle
                cx={x}
                cy={y}
                r={12}
                fill={pos === selected ? t.acc : 'transparent'}
                stroke={pos === selected || pos === current ? t.acc : t.ink}
                strokeWidth={2}
                strokeDasharray={pos === current && pos !== selected ? '4' : undefined}
                onPress={onPick ? () => onPick(pos) : undefined}
              />
              {/* área de toque maior que o círculo */}
              {onPick && <Circle cx={x} cy={y} r={20} fill="transparent" onPress={() => onPick(pos)} />}
              <SvgText x={x} y={y + 27} textAnchor="middle" fontSize={12} fontWeight="700" fill={t.mut}>
                {SHORT[pos]}
              </SvgText>
            </G>
          )),
        )}
      </Svg>
    </View>
  );
}

/** Dado de 20 lados que gira ao aparecer. */
export function D20({ value }: { value: number }) {
  const t = useTheme();
  const a = useState(() => new Animated.Value(0))[0];
  useEffect(() => {
    Animated.timing(a, { toValue: 1, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [a]);
  return (
    <Animated.View
      style={{
        width: 46,
        height: 46,
        opacity: a,
        transform: [
          { rotate: a.interpolate({ inputRange: [0, 1], outputRange: ['-540deg', '0deg'] }) },
          { scale: a.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) },
        ],
      }}
    >
      <Svg width={46} height={46} viewBox="0 0 46 46">
        <Path d="M23 0L46 11.5V34.5L23 46L0 34.5V11.5z" fill={t.acc} />
        <SvgText x={23} y={31} textAnchor="middle" fontSize={22} fontWeight="800" fill={t.accText}>
          {String(value)}
        </SvgText>
      </Svg>
    </Animated.View>
  );
}
